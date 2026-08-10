import MembersContainer from './container';

export default function Members() {
  // 本来はサーバーサイドでメンバーデータを取得したいが、reactのバグが発生するため、クライアントサイドで取得する

  return <MembersContainer />;
}
