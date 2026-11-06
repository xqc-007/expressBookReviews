const { getAllBooks, getBooksByISBN, getBooksByAuthor, getBooksByTitle } = require('./router/general');
async function main() {
  console.log('All books:', await getAllBooks());
  console.log('ISBN 1:', await getBooksByISBN('1'));
  console.log('Author Unknown:', await getBooksByAuthor('Unknown'));
  console.log('Title Things Fall Apart:', await getBooksByTitle('Things Fall Apart'));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
