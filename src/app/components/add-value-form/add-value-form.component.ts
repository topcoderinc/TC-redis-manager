import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';


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
  @Output() onValueUpdate = new EventEmitter();

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
      return {value: '', key: ''};
    }
  }

  /**
   * the component init
   */
  ngOnInit() {
    this.values = [{value: ''}];
    this.orderedValues = [{value: '', score: 0}];
    this.hashMapValues = [{value: '', key: ''}];
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
    arr.splice(index, 1);
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
      hashMapValues: this.hashMapValues,
      values: this.values
    });
  }

}
