const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('/Users/abdulsar/Downloads/Grants Master Sheet.xlsx');

console.log('Sheet names:', workbook.SheetNames);
console.log('\n' + '='.repeat(60));

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\nSheet: ${sheetName}`);
  console.log('='.repeat(60));

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`Rows: ${data.length}`);

  if (data.length > 0) {
    console.log('\nColumn headers:');
    const headers = data[0];
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header}`);
    });

    console.log('\nFirst 3 data rows:');
    for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
      console.log(`\nRow ${i}:`);
      const row = data[i];
      headers.forEach((header, index) => {
        if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
          console.log(`  ${header}: ${row[index]}`);
        }
      });
    }
  }
  console.log('\n');
});
