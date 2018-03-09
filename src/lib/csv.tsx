export class CSVWriter {
  private data: string = '';

  writeRow(inputCols: ReadonlyArray<any>) {
    let cols = [];
    for (let col of inputCols) {
      col = String(col);

      if (col.includes(',') || col.includes('\n') || col.includes('"')) {
        col = `"${col.replace(/"/g, '""')}"`;
      }

      cols.push(col);
    }

    this.data = this.data + cols.join(',') + '\n';
  }

  getData() {
    return this.data;
  }
}
