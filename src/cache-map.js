// CacheMap exported from sequencer.
module.exports = class CacheMap {
  constructor(options) {
      this.map = new Map();
      this.options = Object.assign({ ttl: 5 * 60, checkTime: 10 * 60 }, options);
      this.timeout = null;
  }
  set(key, value, ttl = this.options.ttl) {
      const entry = this.map.get(key);
      if (entry) {
          entry.value = value;
          entry.expires = ttl ? Date.now() + ttl * 1000 : null;
      }
      else {
          this.map.set(key, {
              key,
              value,
              expires: ttl ? Date.now() + ttl * 1000 : null,
          });
          if (this.timeout !== null) {
              this.timeout = setTimeout(this.update, this.options.checkTime * 1000);
          }
      }
  }
  get(key) {
      const entry = this.map.get(key);
      if (entry && (!entry.expires || entry.expires > Date.now())) {
          return entry.value;
      }
      return null;
  }
  has(key) {
      return this.map.has(key);
  }
  touch(key, ttl = this.options.ttl) {
      const entry = this.map.get(key);
      if (entry) {
          entry.expires = ttl ? Date.now() + ttl * 1000 : null;
      }
  }
  update() {
      this.map.forEach(entry => {
          if (entry.expires && entry.expires < Date.now()) {
              this.delete(entry.key);
          }
      });
      if (this.map.size >= 1) {
          this.timeout = setTimeout(this.update, this.options.checkTime);
      }
  }
  delete(key) {
      const entry = this.map.get(key);
      if (entry) {
          this.options.onDelete && this.options.onDelete(key, entry.value);
      }
      this.map.delete(key);
      if (this.map.size === 0 && this.timeout) {
          clearTimeout(this.timeout);
      }
  }
  deleteAll() {
      this.map.forEach(entry => {
          this.delete(entry.key);
      });
  }
  dispose() {
      if (this.timeout)
          clearTimeout(this.timeout);
      this.map.clear();
  }
}
