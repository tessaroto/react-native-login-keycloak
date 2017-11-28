import {
  Linking,
} from 'react-native';
import * as querystring from 'query-string';
import uuidv4 from 'uuid/v4';
import {
  decodeToken,
} from './util';


export class Login {
    state;
    conf;
    tokenStorage;

    constructor() {
      this.state = {};
      this.onOpenURL = this.onOpenURL.bind(this);
      Linking.addEventListener('url', this.onOpenURL);
    }

    tokens() {
      return this.tokenStorage.loadTokens();
    }

    start(conf) {
      this.conf = conf;
      return new Promise(((resolve, reject) => {
        const {
          url,
          state,
        } = this.getLoginURL();
        this.state = {
          ...this.state,
          resolve,
          reject,
          state,
        };

        Linking.openURL(url);
      }));
    }

    end() {
      const {
        client_id,
        redirect_uri,
      } = this.conf;
        // If this is a logout function, you gotta remove it by doing a post or something similar to keycloak.
      const headers = new Headers();
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
      this.tokens().then((savedTokens) => {
        const body = querystring.stringify({
          client_id,
          refresh_token: savedTokens.refresh_token,
        });

        const url = `${this.getRealmURL()}/protocol/openid-connect/logout`;
        fetch(url, {
          method: 'POST',
          headers,
          body,
        }).then((response) => {
          if (response.ok) {
            this.tokenStorage.clearTokens();
            return true;
          }
          return false;
        });
      });
    }

    onOpenURL(event) {
      if (event.url.startsWith(this.conf.appsite_uri)) {
        const {
          state,
          code,
        } = querystring.parse(querystring.extract(event.url));
        if (this.state.state === state) {
          this.retrieveTokens(code);
        }
      }
    }

    retrieveTokens(code) {
      const {
        redirect_uri,
        client_id,
      } = this.conf;
      const url = `${this.getRealmURL()}/protocol/openid-connect/token`;

      const headers = new Headers();
      headers.set('Content-Type', 'application/x-www-form-urlencoded');

      const body = querystring.stringify({
        grant_type: 'authorization_code',
        redirect_uri,
        client_id,
        code,
      });

      fetch(url, {
        method: 'POST',
        headers,
        body,
      }).then((response) => {
        response.json().then((json) => {
          // console.log(json);
          if (json.error) {
            this.state.reject(json);
          } else {
            // console.log(json);
            this.tokenStorage.saveTokens(json);
            this.state.resolve(json);
          }
        });
      });
    }

    decodeToken(token) {
      return decodeToken(token);
    }

    getRealmURL() {
      const {
        url,
        realm,
      } = this.conf;
      const slash = url.endsWith('/') ? '' : '/';
      return `${url + slash}realms/${encodeURIComponent(realm)}`;
    }

    getLoginURL() {
      const {
        redirect_uri,
        client_id,
        kc_idp_hint,
      } = this.conf;
      const response_type = 'code';
      const state = uuidv4();
      const scope = 'openid';
      const url = `${this.getRealmURL()}/protocol/openid-connect/auth?${querystring.stringify({
        scope,
        kc_idp_hint,
        redirect_uri,
        client_id,
        response_type,
        state,
      })}`;

      return {
        url,
        state,
      };
    }

    setTokenStorage(tokenStorage) {
      this.tokenStorage = tokenStorage;
    }
}
