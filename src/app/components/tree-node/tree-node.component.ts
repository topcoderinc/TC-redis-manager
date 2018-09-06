import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

/**
 * tree node component
 */
@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent implements OnInit {
  @Input() itemNode = null;
  @Input() selectedMap = null;
  @Input() expandedMap = null;
  @Output() onItemClick = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
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
}
