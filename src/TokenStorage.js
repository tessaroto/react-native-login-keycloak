import { AsyncStorage } from 'react-native';

export class TokenStorage {
  key;
  constructor(key) {
    this.key = key;
  }

  saveTokens(tokens) {
    return AsyncStorage.setItem(this.key, JSON.stringify(tokens));
  }

  loadTokens() {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(this.key).then(value => resolve(JSON.parse(value)));
    });
  }

  clearTokens() {
    return AsyncStorage.removeItem(this.key);
  }
}
