import jwt
import requests
import base64
import time
from typing import Optional, Dict, Any, Set
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from core.config import get_auth0_config
from core.exceptions import AuthenticationError, AuthorizationError, ExternalServiceError
from core.logging import get_logger

logger = get_logger("auth")


class TokenBlacklist:
    """シンプルなインメモリトークンブラックリスト。本番環境ではRedisを使用"""
    
    def __init__(self):
        self._blacklist: Set[str] = set()
        self._expiry_times: Dict[str, float] = {}
    
    def add_token(self, token: str, expiry_time: Optional[float] = None):
        """トークンをブラックリストに追加"""
        self._blacklist.add(token)
        if expiry_time:
            self._expiry_times[token] = expiry_time
    
    def is_blacklisted(self, token: str) -> bool:
        """トークンがブラックリストに含まれているかチェック"""
        current_time = time.time()
        expired_tokens = [
            token for token, expiry in self._expiry_times.items() 
            if expiry < current_time
        ]
        for expired_token in expired_tokens:
            self._blacklist.discard(expired_token)
            self._expiry_times.pop(expired_token, None)
        
        return token in self._blacklist
    
    def revoke_token(self, token: str):
        """トークンを無効化(add_tokenのエイリアス)"""
        self.add_token(token)


class JWKSCache:
    """TTLサポート付きJWKSキャッシュ"""
    
    def __init__(self, ttl: int = 3600):
        self._cache: Dict[str, Any] = {}
        self._cache_time: float = 0
        self._ttl = ttl
    
    def is_valid(self) -> bool:
        """キャッシュがまだ有効かチェック"""
        return time.time() - self._cache_time < self._ttl
    
    def get(self) -> Optional[Dict[str, Any]]:
        """有効な場合、キャッシュされたJWKSを取得"""
        if self.is_valid():
            return self._cache
        return None
    
    def set(self, jwks: Dict[str, Any]):
        """JWKSキャッシュを設定"""
        self._cache = jwks
        self._cache_time = time.time()
    
    def clear(self):
        """キャッシュをクリア"""
        self._cache = {}
        self._cache_time = 0


class AuthorizationService:
    """認証・認可サービス(シングルトンパターン)"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AuthorizationService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._jwks_cache = JWKSCache(ttl=3600)
            self._token_blacklist = TokenBlacklist()
            self._auth0_config = None
            self._initialized = True
    
    def authenticate_request(self, headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """JWTトークンを検証し、デコードされたペイロードを返す"""
        try:
            token = self._extract_token(headers)
            if not token:
                logger.warning("No token found in request")
                return None

            logger.info("Token found, attempting verification")
            
            if self._token_blacklist.is_blacklisted(token):
                logger.warning("Token is blacklisted")
                raise AuthenticationError(
                    "Token has been revoked",
                    error_code="TOKEN_REVOKED"
                )
            
            try:
                payload = self._verify_token(token)
                logger.info("Token verification successful", extra={
                    "user_id": payload.get("sub"),
                    "audience": payload.get("aud"),
                    "issuer": payload.get("iss")
                })
                return payload
            except Exception as e:
                logger.warning(f"Token verification failed: {str(e)}")
                raise AuthenticationError(
                    f"Token verification failed: {str(e)}",
                    error_code="TOKEN_VERIFICATION_ERROR"
                )
                
        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {str(e)}")
            raise AuthenticationError(
                f"Authentication failed: {str(e)}",
                error_code="AUTH_UNEXPECTED_ERROR"
            )

    def revoke_token(self, token: str):
        """トークンをブラックリストに追加して無効化"""
        try:
            try:
                unverified_payload = jwt.decode(token, options={"verify_signature": False})
                exp = unverified_payload.get('exp')
                if exp:
                    self._token_blacklist.add_token(token, exp)
                else:
                    self._token_blacklist.add_token(token)
            except (jwt.InvalidTokenError, jwt.DecodeError, KeyError):
                self._token_blacklist.add_token(token)
            
            logger.info("Token revoked successfully")
        except Exception as e:
            logger.error(f"Error revoking token: {str(e)}")
            raise AuthenticationError(
                f"Token revocation failed: {str(e)}",
                error_code="TOKEN_REVOCATION_ERROR"
            )

    def _extract_token(self, headers: Dict[str, str]) -> Optional[str]:
        """AuthorizationヘッダーからJWTトークンを抽出"""
        auth_header = headers.get('authorization', '')
        if not auth_header:
            return None
        
        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        return parts[1]

    def _verify_token(self, token: str) -> Dict[str, Any]:
        """JWTトークンを検証(署名検証付き)"""
        try:
            if not self._auth0_config:
                self._auth0_config = get_auth0_config()
            
            jwks = self._get_jwks()
            
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid or kid not in jwks:
                logger.warning(f"Invalid key ID: {kid}")
                raise AuthenticationError(
                    "Invalid token key ID",
                    error_code="INVALID_KEY_ID"
                )
            
            public_key = jwks[kid]
            
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                issuer=f"https://{self._auth0_config.domain}/",
                audience=self._auth0_config.audience,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True
                }
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            raise AuthenticationError(
                "Token has expired",
                error_code="TOKEN_EXPIRED"
            )
        except jwt.InvalidAudienceError:
            logger.warning("Invalid audience in token")
            raise AuthenticationError(
                "Invalid token audience",
                error_code="INVALID_AUDIENCE"
            )
        except jwt.InvalidIssuerError:
            logger.warning("Invalid issuer in token")
            raise AuthenticationError(
                "Invalid token issuer",
                error_code="INVALID_ISSUER"
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise AuthenticationError(
                f"Invalid token: {str(e)}",
                error_code="INVALID_TOKEN"
            )
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {str(e)}")
            raise AuthenticationError(
                f"Token verification failed: {str(e)}",
                error_code="TOKEN_VERIFICATION_ERROR"
            )

    def _get_jwks(self) -> Dict[str, Any]:
        """JWKS(JSON Web Key Set)を取得し、キャッシュする"""
        cached_jwks = self._jwks_cache.get()
        if cached_jwks:
            logger.debug("Using cached JWKS")
            return cached_jwks
        
        try:
            if not self._auth0_config:
                self._auth0_config = get_auth0_config()
            
            jwks_url = f"https://{self._auth0_config.domain}/.well-known/jwks.json"
            
            logger.info(f"Fetching JWKS from: {jwks_url}")
            
            try:
                response = requests.get(jwks_url, timeout=10)
                response.raise_for_status()
                jwks_data = response.json()
            except requests.RequestException as e:
                logger.error(f"Failed to fetch JWKS: {str(e)}")
                raise ExternalServiceError(
                    f"Failed to fetch JWKS: {str(e)}",
                    error_code="JWKS_FETCH_ERROR"
                )
            except Exception as e:
                logger.error(f"Unexpected error fetching JWKS: {str(e)}")
                raise ExternalServiceError(
                    f"Unexpected error fetching JWKS: {str(e)}",
                    error_code="JWKS_UNEXPECTED_ERROR"
                )
            
            jwks_dict = {}
            for key_data in jwks_data.get('keys', []):
                kid = key_data.get('kid')
                if not kid:
                    continue
                
                try:
                    x5c = key_data.get('x5c', [])
                    if not x5c:
                        continue
                    
                    cert_der = base64.b64decode(x5c[0])
                    cert = x509.load_der_x509_certificate(cert_der)
                    public_key = cert.public_key()
                    
                    jwks_dict[kid] = public_key
                except Exception as e:
                    logger.warning(f"Failed to process key {kid}: {str(e)}")
                    continue
            
            self._jwks_cache.set(jwks_dict)
            logger.info(f"JWKS cached successfully with {len(jwks_dict)} keys")
            return jwks_dict
            
        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in JWKS processing: {str(e)}")
            raise ExternalServiceError(
                f"JWKS processing failed: {str(e)}",
                error_code="JWKS_PROCESSING_ERROR"
            )

