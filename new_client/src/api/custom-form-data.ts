const appendFormData = (fd: FormData, key: string, value: any) => {
  if (value === undefined) return;
  if (value === null) {
    fd.append(key, '');
    return;
  }

  if (value instanceof Blob) {
    fd.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((v) => appendFormData(fd, `${key}[]`, v));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      appendFormData(fd, `${key}[${k}]`, v);
    });
    return;
  }

  fd.append(key, String(value));
};

export const customFormData = <Body>(body: Body): FormData => {
  const data = body as Record<string, unknown>;
  const formData = new FormData();

  Object.entries(data).forEach(([k, v]) => {
    appendFormData(formData, k, v);
  });

  return formData;
};
