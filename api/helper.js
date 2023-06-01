function getOffset(currentPage = 1, listPerPage) {
  return (currentPage - 1) * [listPerPage];
}

function emptyOrRows(rows) {
  if (!rows) {
    return [];
  }
  return rows;
}

function singleOrNone(row) {
  if (!row) {
    return null;
  }
  if (row == []) {
    return null;
  }
  return row[0];
}

module.exports = {
  getOffset,
  emptyOrRows,
  singleOrNone
}
