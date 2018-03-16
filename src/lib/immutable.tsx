
export class Immutable {
  copy() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  update(fields: { [key: string]: any }) {
    let inst = this.copy();

    for (const fieldName of Object.keys(fields)) {
      inst[fieldName] = fields[fieldName];
    }

    this.replace(inst);
  }

  replace(inst: any) {
    return;
  }
}
