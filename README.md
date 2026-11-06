# Book Review Application

IBM Node.js and Express final project. Uses the original `final_project/router/booksdb.js` catalogue unchanged.

## Run

Requires Node.js 18+ and npm. From the repository root:

```bash
cd final_project
npm ci
npm start
```

The API listens on http://127.0.0.1:5000. In another terminal:

```bash
cd final_project
npm test
npm run client
```

`PORT` changes the server port; set `BOOK_API_URL` to the same URL when running the Axios client against a different port.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | All books |
| GET | `/isbn/:isbn` | Book by catalogue ISBN key |
| GET | `/author/:author` | Case-insensitive author search |
| GET | `/title/:title` | Case-insensitive title search |
| GET | `/review/:isbn` | Public reviews for a book |
| POST | `/register` | Register with JSON username and password |
| POST | `/customer/login` | Login and create an authenticated session |
| PUT | `/customer/auth/review/:isbn` | Add or update the logged-in user's review |
| DELETE | `/customer/auth/review/:isbn` | Delete only the logged-in user's review |

Author and title searches support partial matches and return ISBN-keyed objects. The original catalogue uses keys 1–10 as its ISBN identifiers. Empty initial reviews are `{}`. Reviews can be supplied through a JSON `review` property or a `review` query parameter.

## Authentication and concurrent access

Passwords are salted and hashed using asynchronous scrypt. Login regenerates the session and stores a signed, expiring JWT on the server. Protected endpoints verify the JWT and use its username rather than a caller-supplied username. Duplicate registration is checked again after hashing. Individual users' review updates are synchronous in-memory mutations, so concurrent clients cannot overwrite another user's review through these routes.

This is an educational in-memory implementation: users, reviews and sessions reset on restart. A production deployment needs persistent storage and a shared session store. Set `JWT_SECRET`, `SESSION_SECRET` and HTTPS cookie settings appropriately when deploying.

## Axios implementations

`final_project/router/general.js` exports four clients alongside the Express router:

- `getAllBooks(callback)`: async/await with an optional error-first callback.
- `getBooksByISBN(isbn)`: Promise chaining with `.then()`.
- `getBooksByAuthor(author)`: async/await.
- `getBooksByTitle(title)`: async/await.

Run `npm run client` with the server running to demonstrate all four. Requests use Axios and URL-encode search values. Rejections propagate to the caller.

## Assignment evidence

`submission_answers.md` contains actual cURL commands and responses for Questions 2–10. The individual files are in `evidence/`, with the exact required names. `evidence/axios_demo` contains the actual client demonstration output.

To reproduce the API evidence, restart the server first (the demo user must not already exist), then run from the repository root:

```bash
python3 scripts/capture_api.py
```

The credentials in the evidence are fictional demonstration credentials.

### Submit

1. Open `submission_answers.md` and copy the command/output blocks into Questions 1–10.
2. For Question 11, submit https://github.com/xqc-007/expressBookReviews/blob/main/final_project/router/general.js

The fork metadata in `evidence/githubrepo` was captured from GitHub using cURL and verified against the IBM parent repository. To refresh it, run `python3 scripts/capture_githubrepo.py xqc-007`.
