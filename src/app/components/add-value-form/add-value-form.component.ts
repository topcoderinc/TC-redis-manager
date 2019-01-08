import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import _ from 'lodash';

/**
 * the new value form dialog component
 */
@Component({
  selector: 'app-add-value-form',
  templateUrl: './add-value-form.component.html',
  styleUrls: ['./add-value-form.component.scss']
})
export class AddValueFormComponent implements OnInit {
  @Input() type = null;
  @Input() initValues = null;
  @Input() initOrderedValues = null;
  @Input() initHashMapValues = null;
  @Input() isEditMode = false;
  @Output() onValueUpdate = new EventEmitter();
  @Output() onValueDelete = new EventEmitter();

  values = [];
  orderedValues = [];
  hashMapValues = [];

  constructor() {
  }

  /**
   * get a empty value item
   * @return {any} the item
   */
  getEmptyItem() {
    if (this.type === 'List' || this.type === 'Set') {
      return {value: ''};
    } else if (this.type === 'Ordered Set') {
      return {value: '', score: 0};
    } else if (this.type === 'Hash Map') {
      return {value: '', key: '', isNew: true};
    }
  }

  /**
   * the component init
   */
  ngOnInit() {
    this.values = this.initValues ? _.clone(this.initValues) : [{value: ''}];
    this.orderedValues = this.initOrderedValues ? _.clone(this.initOrderedValues) : [{value: '', score: 0}];
    this.hashMapValues = this.initHashMapValues ? _.clone(this.initHashMapValues) : [{value: '', key: ''}];
  }

  /**
   * get value item array
   * @return {any[]} tge array
   */
  getItemArray() {
    if (this.type === 'Ordered Set') {
      return this.orderedValues;
    } else if (this.type === 'Hash Map') {
      return this.hashMapValues;
    }
    return this.values;
  }

  /**
   * on remove item
   * @param arr the item array
   * @param index the index
   */
  onRemoveItem(arr, index) {
    if (this.isEditMode) {
      this.onValueDelete.emit({
        element: arr[index],
        callback: () => {
          arr.splice(index, 1);
        }
      });
    } else {
      arr.splice(index, 1);
    }
  }

  /**
   * on add new item
   * @param arr the arr
   */
  onAddItem(arr) {
    arr.push(this.getEmptyItem());
  }

  /**
   * on value change event
   */
  onValueChange() {
    this.onValueUpdate.emit({
      orderedValues: this.orderedValues,
      hashMapValues: _.map(this.hashMapValues, (o) => { return _.omit(o, 'isNew'); }),
      values: this.values
    });
  }

}
