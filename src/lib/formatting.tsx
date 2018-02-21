export function prettyFormatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function prettyFormatSeconds(value: number): string {
  if (value < 0) {
    return value.toFixed(4).toString();
  } else {
    return value.toFixed(2).toString();
  }
}

export function prettyFormatBytes(bytes: number | string): string {
  if (typeof bytes === 'string') {
    bytes = parseInt(bytes, 10);
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) {
    return `${bytes} ${sizes[i]})`;
  }
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}
