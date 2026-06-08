function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Simple but reasonable email regex
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

module.exports = { isValidEmail };
