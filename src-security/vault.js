class Vault {
  constructor() {
    this.store = {
      'kimi_key': 'mock_kimi_thermo',
      'claude_key': 'mock_claude_thermo'
    };
    this.rotated = Date.now();
  }

  get(k) {
    if (!this.store[k]) {
      throw { code: 'VAULT-404', message: 'Not Found' };
    }
    console.log(`Thermonuclear Get ${k}`);
    return this.store[k];
  }

  put(k, v) {
    console.log(`Thermonuclear Put ${k}`);
    this.store[k] = v;
    this.rotated = Date.now();
  }

  rotate() {
    console.log("Thermonuclear Rotate Keys");
    // Update ALL keys with new_mock_ prefix
    const newStore = {};
    for (const [key, value] of Object.entries(this.store)) {
      newStore[key] = `new_mock_${key}`;
    }
    this.store = newStore;
    this.rotated = Date.now();
  }
}

export const vault = new Vault();

// Dummy rotate call
vault.rotate();