import {Component, EventEmitter, Input, OnInit, Output, OnChanges} from '@angular/core';

/**
 * tree node component
 */
@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent implements OnInit, OnChanges {
  @Input() itemNode = null;
  @Input() selectedMap = null;
  @Input() expandedMap = null;
  @Output() onItemClick = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
    this.ngOnChanges();
  }


  /**
   * get basic type identify sign
   * @param type the data type
   */
  getSignByType(type) {
    const typesMap = {
      list: '[...]',
      set: 'set',
      zset: 'zset',
      hash: '{...}',
      string: 'abc'
    };
    return typesMap[type];
  }

  ngOnChanges() {
    if (!this.itemNode || !this.itemNode.children || !this.itemNode.key) {
      return;
    }

    const setDisplayName = item => {
      if (item.key.indexOf('{') === -1) {
        return item.displayName = item.name;
      }

      if (item.key.indexOf(',') === -1) {
        return item.displayName = 'API Request' + '*';
      }
      const regexResults = item.key.match(/[^,{}]+(?=,|{|})(?=,|\{)/g);
      let index = regexResults.length - 1;
      item.displayName = regexResults[index];
      while (item.displayName.indexOf(':') === -1) {
        index -= 1;
        item.displayName = regexResults[index] + item.displayName;
      }

      item.displayName += item.children ? '*' : '';
    };

    setDisplayName(this.itemNode);
    this.itemNode.children.forEach(setDisplayName);

  }
}
