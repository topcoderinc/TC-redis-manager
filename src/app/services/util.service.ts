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
    this.snackbar.open(msg, 'OK', {duration: 2000});
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
}
