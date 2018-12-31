import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material';

/**
 * the common util services
 */
@Injectable({
  providedIn: 'root'
})
export class UtilService {
  constructor(private snackbar: MatSnackBar) {
  }

  /**
   * show a message
   * @param msg the message text
   * @param {string} type
   */
  public showMessage(msg, type = 'normal') {
    this.snackbar.open(msg, 'OK', {duration: 2000, verticalPosition: 'top'});
  }

  /**
   * get value, if string value is empty or null, it will return null
   * @param v the string value
   */
  public getValue(v) {
    if (!v) {
      return null;
    }
    v = v.toString();
    if (v.trim().length === 0) {
      return null;
    }
    return v.trim();
  }

  /**
   * split request key
   * @param key the key value
   */
  public splitKey(key) {
    const trimStr = (s, c): string => {
      if (c === ']') {
        c = '\\]';
      }
      if (c === '\\') {
        c = '\\\\';
      }
      return s.replace(new RegExp(
        '^[' + c + ']+|[' + c + ']+$', 'g'
      ), '');
    };

    const v = trimStr(key, '{');
    const newKeys = v.split(',');
    const results = [];

    for (let i = 0; i < newKeys.length; i++) {
      if (newKeys[i].indexOf('{') > 0) {
        const keys = newKeys[i].split('{');
        results.push(keys[0]);
        for (let j = 1; j < keys.length; j++) {
          const t = trimStr(keys[j], '}');
          if (t && t.length > 0) {
            results.push(t);
          }
        }
      } else {
        results.push(trimStr(newKeys[i], '}'));
      }
    }
    if (key[key.length - 1] !== '}') {
      return results.slice(0, results.length - 1);
    }
    return results;
  }

}
