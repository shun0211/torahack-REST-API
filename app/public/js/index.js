const indexModule = (() => {
  // 検索ボタンをクリックしたときのイベントリスナー設定
  document.getElementById('search-btn').addEventListener('click', () => {
    return searchModule.searchUsers()
  })

  // UsersモジュールのfetchAllUsersメソッドを呼び出す
  return usersModule.fetchAllUsers()
})()
