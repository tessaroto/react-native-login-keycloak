import { Login } from './Login';
import { TokenStorage } from './TokenStorage';

const login = new Login();
login.setTokenStorage(new TokenStorage('react-native-token-storage'));

export default login;
