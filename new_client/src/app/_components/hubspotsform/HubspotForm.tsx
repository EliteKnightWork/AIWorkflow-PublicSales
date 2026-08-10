'use client';
import { useEffect } from 'react';

type HubSpotFormProps = {
  divId: string;
  formId: string;
};

export default function HubSpotForm({ divId, formId }: HubSpotFormProps) {
  useEffect(() => {
    // HubSpotのスクリプトを動的に追加
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/v2.js';
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      if ((window as any).hbspt) {
        (window as any).hbspt.forms.create({
          portalId: '20803783', // HubSpotのポータルIDを入れる
          formId: formId, // HubSpotのフォームIDを入れる
          target: `#${divId}`, // フォームを表示するDOM要素のID
          region: 'na1',
        });
      }
    };

    // クリーンアップ
    return () => {
      document.body.removeChild(script);
    };
  }, [divId, formId]);

  return <div id={divId} />;
}
