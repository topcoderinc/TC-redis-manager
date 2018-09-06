import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AddServerDialogComponent} from './components/add-server-dialog/add-server-dialog.component';
import {RedisInstance} from './models/redis-instance';
import uuid from 'uuid';
import {RedisService} from './services/redis.service';
import _ from 'lodash';
import {UtilService} from './services/util.service';

/**
 * return a new right page component
 */
const getNewPage = () => ({
  type: '',
  id: '',
  loading: false,
  item: [],
});


/**
 * the main component
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'REDIS MANAGER GUI TOOLS';
  instances = [];

  public currentPage = getNewPage();
  public currentInstance = null;

  public dragObject = {
    minWidth: 250,
    currentWidth: 300,
    startClientX: 0,
    pressed: false,
  };

  private requireId = '';

  constructor(public dialogService: MatDialog,
              private redisService: RedisService,
              private util: UtilService,
  ) {

    const redisInstance = new RedisInstance();
    redisInstance.serverModel = {name: 'default-local', ip: 'localhost', port: 6379, db: 0, password: ''};
    redisInstance.id = uuid();
    this.instances.push(redisInstance);
    this.connectInstance(redisInstance);
  }

  /**
   * connect a redis instance
   * @param redisInstance the redis instance data
   * @param {() => null} scb the success callback
   */
  connectInstance(redisInstance, scb = () => null) {
    redisInstance.status = 'connecting';
    redisInstance.working = true;
    this.redisService.connect(redisInstance).subscribe(result => {
      this.getInstanceById(result.id).status = 'connected';
      redisInstance.working = false;
      scb();
    }, e => {
      this.getInstanceById(redisInstance.id).status = 'failed';
      redisInstance.working = false;
      this.util.showMessage(`redis ${redisInstance.id} connect failed`);
    });
  }

  /**
   * refresh and expand
   */
  refreshAndExpand() {

  }

  /**
   * get redis instance by id
   * @param id the instance id
   */
  getInstanceById(id) {
    return this.instances.find(ins => ins.id === id) || {};
  }

  /**
   * on add server event
   */
  onAddServer() {
    const ref = this.dialogService.open(AddServerDialogComponent, {
      width: '250px',
      data: {name: 'localhost', password: '', ip: 'localhost', port: 6379, db: 0},
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        const instance = new RedisInstance();
        instance.id = uuid();
        instance.serverModel = result;
        this.instances.push(instance);
        this.connectInstance(instance, () => {
          this.util.showMessage('redis connect successful');
        });
      }
    });
  }

  /**
   * on refresh event
   */
  onRefresh() {
    if (!this.currentInstance) {
      this.util.showMessage('you need select Redis instance first');
      return;
    }

    const instance = this.currentInstance;
    instance.working = true;
    instance.status = 'connecting';
    this.redisService.connect(instance).subscribe(() => {
      instance.status = 'connected';
      if (instance.expanded) {
        instance.working = true;
        this.redisService.fetchTree({id: instance.id}).subscribe(ret => {
          instance.children = ret;
          instance.working = false;
        }, () => {
          instance.working = false;
        });
      } else {
        instance.working = false;
      }
    }, e => {
      instance.status = 'failed';
      instance.working = false;
    });
  }

  /**
   * mouse move event
   * @param evt
   */
  mouseMove(evt) {
    if (!this.dragObject.pressed) {
      return;
    }
    if (evt.clientX + 10 <= this.dragObject.minWidth) {
      return;
    }
    this.dragObject.currentWidth = evt.clientX + 10;
  }

  ngOnInit(): void {

  }

  /**
   * when user click disconnect on a redis instance
   * @param id the redis instance id
   */
  onDisconnect(id) {
    this.currentPage = getNewPage();
    if (this.getInstanceById(id)) {
      this.getInstanceById(id).expanded = false;
      this.getInstanceById(id).status = null;
      this.getInstanceById(id).selected = false;
    }
    this.currentInstance = null;
  }

  /**
   * when user enter values and click ok to add new value for redis
   * @param newValue the new value model
   */
  onNewValue(newValue) {
    this.redisService.call(newValue.id, [newValue.rawLine]).subscribe(ret => {
      this.onRefresh();
      if (newValue.onSuccess) {
        newValue.onSuccess(newValue);
      }
      this.util.showMessage('new value added successful');
    }, e => {
      console.error(e);
      this.util.showMessage('new value add failed');
    });
  }

  /**
   * on delete value (succeed)
   */
  onDeleteValue() {
    this.currentPage = getNewPage();
  }

  /**
   * right page changed
   * @param page the page data
   */
  updatePage(page) {
    const {id, type} = page;
    if (page.type === 'root-instance') { // show server information
      this.requireId = uuid();
      this.instances.forEach(i => i.selected = false);
      this.currentInstance = this.getInstanceById(id);
      if (!this.currentInstance) {
        this.util.showMessage('cannot found redis instance id = ' + id);
        return;
      }
      this.currentInstance.selected = true;
      const rId = _.clone(this.requireId);
      this.currentPage = {
        id, type,
        loading: true,
        item: [],
      };
      this.connectInstance(this.currentInstance, () => {
        this.redisService.call(id, [['info']]).subscribe(ret => {
          const rawInfo = ret[0];
          const result = [];
          rawInfo.split('\n').forEach(line => {
            if (line.indexOf('#') === 0) {
              return;
            }
            if (line.trim() === '') {
              return;
            }
            const parts = line.split(':');
            result.push({
              key: parts[0].split('_').join(' '),
              value: parts[1],
            });
          });
          if (rId === this.requireId) { // page didn't update
            this.currentPage.item = result;
            this.currentPage.loading = false;
          }
        }, () => {
          this.getInstanceById(id).status = 'failed';
          return this.util.showMessage('redis instance not exist');
        });
      });
    } else if (page.type === 'data-viewer') {
      this.currentPage = {
        id, type, loading: true, item: page.item
      };
    }
  }
}
