const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
// pathのモジュールは標準で入っている
const path = require('path')
const bodyParser = require('body-parser')

const dbPath = "app/db/database.sqlite3"

// リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// publicディレクトリを静的ファイル群のルートディレクトリとして設定
// pathモジュールのjoinメソッド → 第一引数のディレクトリと第二引数のディレクトリをつなげるメソッド
// __dirnameでapp.jsが現在いるディレクトリが示される
app.use(express.static(path.join(__dirname, 'public')));

// Get all users
app.get('/api/v1/users', (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath)

  db.all('SELECT * FROM users', (err, rows) => {
    res.json(rows)
  })

  db.close()
})

// Get a user
app.get('/api/v1/users/:id', (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

  db.get(`SELECT * FROM users WHERE id = ${id}`, (err, row) => {
    if (!row) {
      res.status(404).send( { error: "Not found" } )
    } else {
    res.status(200).json(row)
    }
  })

  db.close()
})

// Get following users
app.get('/api/v1/users/:id/following', (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

  db.all(`SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${id}`, (err, rows) => {
    if (!rows) {
      res.status(404).send( { error: "Not found" } )
    } else {
      res.status(200).json(rows)
    }
  })

  db.close()
})

// Get following a user
app.get('/api/v1/users/:id/following/:following_id', (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const following_id = req.params.following_id

  db.get(`SELECT * FROM users WHERE id = ${following_id}`, (err, row) => {
    if (!row) {
      res.status(404).send( { error: "Not found" } )
    } else {
      res.status(200).json(row)
    }
  })
  db.close()
})

// following a user
app.post('/api/v1/users/:id/following/:following_id', async (req, res) => {
  const id = req.params.id
  const following_id = req.params.following_id
  if (!following_id) {
    res.status(400).send( { error: "フォローするユーザが指定されていません。" } )
  } else {
    const db = new sqlite3.Database(dbPath)

    try {
      await run(
        `INSERT INTO following (following_id, followed_id) VALUES ("${id}", "${following_id}")`,
        db,
      )
      res.status(201).send( { message: "フォロー処理が完了しました！" } )
    } catch (e) {
      res.status(500).send( { error: e } )
    }

    db.close()
  }
})

// Search users matching keyword
app.get('/api/v1/search', (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath)
  const keyword = req.query.q

  db.all(`SELECT * FROM users WHERE name LIKE "%${keyword}%"`, (err, rows) => {
    res.json(rows)
  })

  db.close()
})

const run = async (sql, db) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        return reject(err)
      } else {
        return resolve()
      }
    })
  })
}

// Create a new user
app.post('/api/v1/users', async (req, res) => {
  if (!req.body.name || req.body.name === "") {
    res.status(400).send( { error: "ユーザ名が指定されていません。" })
  } else {
    const db = new sqlite3.Database(dbPath)

    const name = req.body.name
    const profile = req.body.profile ? req.body.profile : ""
    const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : ""

    try {
      await run(
        `INSERT INTO users (name, profile, date_of_birth) VALUES ("${name}", "${profile}", "${dateOfBirth}")`,
        db,
      )
      res.status(201).send( { message: "新規ユーザーを作成しました。" } )
    } catch (e) {
      res.status(500).send( { error: e } )
    }

    db.close()
  }
})

// Update user data
app.put('/api/v1/users/:id', async (req, res) => {
  if (!req.body.name || req.body.name === "") {
    res.status(400).send( { error: "ユーザ名が指定されていません。" })
  } else {
    const db = new sqlite3.Database(dbPath)
    const id = req.params.id

    // 現在のユーザ情報を取得する
    db.get(`SELECT * FROM users WHERE id=${id}`, async (err, row) => {

      if (!row) {
        res.status(404).send( { error: "指定されたユーザが見つかりません。" } )
      } else {
        const name = req.body.name ? req.body.name : row.name
        const profile = req.body.profile ? req.body.profile : row.profile
        const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : row.date_of_birth

        try {
          await run(
            `UPDATE users SET name="${name}", profile="${profile}", date_of_birth="${dateOfBirth}" WHERE id=${id}`,
            db
          )
          res.status(200).send( { message: "ユーザ情報を更新しました。" } )
        } catch (e) {
          res.status(500).send( { error: e } )
        }
      }
    })

    db.close()
  }
})

// Delete user data
app.delete('/api/v1/users/:id', async (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const id = req.params.id

    // 現在のユーザ情報を取得する
  db.get(`SELECT * FROM users WHERE id=${id}`, async (err, row) => {

    if (!row) {
      res.status(404).send( { error: "指定されたユーザが見つかりません。" } )
    } else {
      try {
        await run(`DELETE FROM users WHERE id=${id}`, db)
        res.status(200).send( { message: "ユーザを削除しました。" } )
      } catch {
        res.status(500).send( { error: e } )
      }
    }
  })
  db.close()
})

const port = process.env.PORT || 3000;
app.listen(port)
console.log("Listen on port: " + port)
