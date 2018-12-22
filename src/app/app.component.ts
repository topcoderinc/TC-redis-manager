import {Component, ElementRef, HostBinding, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AddServerDialogComponent} from './components/add-server-dialog/add-server-dialog.component';
import {RedisInstance} from './models/redis-instance';
import uuid from 'uuid';
import {RedisService} from './services/redis.service';
import {UtilService} from './services/util.service';
import {Store} from '@ngrx/store';
import {
  ADD_REDIS_SERVER,
  DESELECT_ALL_REDIS,
  REDIS_DISCONNECT, REMOVE_REDIS_SERVER, REQ_FETCH_TREE,
  REQ_REDIS_CONNECT,
  SELECT_REDIS
} from './ngrx/actions/redis-actions';
import {Observable, Subject} from 'rxjs';
import {REQ_LOAD_PAGE, REQ_LOAD_ROOT_PAGE} from './ngrx/actions/page-actions';
import {PageModel} from './models/page-model';
import {ADD_COMMAND, CLEAR_HISTORY, TOGGLE_CLI} from './ngrx/actions/cli-actions';
import {ConfirmDialogComponent} from './components/confirm-dialog/confirm-dialog.component';
import {InformationDialogComponent} from './components/information-dialog/information-dialog.component';
import {SettingsDialogComponent} from './components/settings-dialog/settings-dialog.component';
import {ThemeConfig} from './theme-config';

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
  title = 'Easy Redis Manager';
  instances$: Observable<RedisInstance[]> = null;
  currentPage$: Observable<PageModel> = null;
  cli$: Observable<any> = null;
  currentInstance = null;
  cliInputValue = '';
  expandDeepCommand$: Subject<void> = new Subject();

  @ViewChild('cliScrollContent') private cliScrollContent: ElementRef;

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
              private _store: Store<any>,
  ) {
    this.instances$ = this._store.select('redis');
    this.currentPage$ = this._store.select('page');
    this.cli$ = this._store.select('cli');
    this.instances$.subscribe((instances) => {
      this._store.dispatch({type: REQ_REDIS_CONNECT, payload: {instance: instances[0]}});
    });
  }

  findInstance(id) {
    return new Promise(resolve => {
      this.instances$.subscribe(instances => {
        resolve(instances.find(ins => ins.id === id) || {});
      });
    });
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
        const instance = {id: uuid(), serverModel: result};
        this._store.dispatch({type: ADD_REDIS_SERVER, payload: instance});  // add new server
        this._store.dispatch({type: REQ_REDIS_CONNECT, payload: {instance}}); // connect
      }
    });
  }

  onDeleteServer() {
    console.log('here');
    if (!this.currentInstance) {
      this.util.showMessage('you need select Redis instance first');
      return;
    }
    this.dialogService.open(ConfirmDialogComponent, {
      width: '250px', data: {
        title: 'Delete Confirm',
        message: `Are you sure you want delete this server?`
      }
    }).afterClosed().subscribe(ret => {
      if (ret) {
        this._store.dispatch({type: REMOVE_REDIS_SERVER, payload: {instance: this.currentInstance}}); // remove
        this._store.dispatch({type: REQ_LOAD_PAGE, payload: getNewPage()});
        this.currentInstance = null;

        this.util.showMessage('Delete server successfully.');
      }
    });
  }

  /**
   * on refresh event
   */
  onRefresh(expandNodes = false) {
    this.instances$.subscribe(instances => {
      const ins = instances.find(i => i.selected === true);
      if (!ins) {
        this.util.showMessage('you need select Redis instance first');
        return;
      }
      this._store.dispatch({
        type: REQ_REDIS_CONNECT, payload: {
          instance: ins, scb: () => {
            if (expandNodes) {
              ins.expanded = true;
            }
            if (ins.expanded) {
              this._store.dispatch({
                type: REQ_FETCH_TREE, payload: {
                  id: ins.id, scb: () => {
                    if (expandNodes) {
                      setTimeout(() => this.expandDeepCommand$.next(), 0);
                    }
                  }
                }
              });
            }
          }
        }
      });
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
    // set theme
    const theme = localStorage.getItem(ThemeConfig.THEME_KEY) || ThemeConfig.THEMES[0];
    document.getElementById(ThemeConfig.BODY_ID).classList.add(`${theme}-theme`);
  }

  /**
   * when user click disconnect on a redis instance
   * @param id the redis instance id
   */
  onDisconnect(id) {
    this._store.dispatch({type: REDIS_DISCONNECT, payload: {id}});
    this._store.dispatch({type: REQ_LOAD_PAGE, payload: getNewPage()});
  }

  onInformationEvt() {
    this.dialogService.open(InformationDialogComponent, {
      width: '80%',
      height: '80%',
      data: {
        title: 'Delete Confirm',
        message: `Are you sure you want delete this server?`
      }
    });
  }

  onSettingsEvt() {
    this.dialogService.open(SettingsDialogComponent, {
      width: '300px',
      height: '400px'
    });
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
    this._store.dispatch({type: REQ_LOAD_PAGE, payload: getNewPage()});
  }

  /**
   * right page changed
   * @param page the page data
   */
  updatePage(page) {
    const {id, type} = page;
    if (page.type === 'root-instance') { // show server information
      this.requireId = uuid();
      this._store.dispatch({type: DESELECT_ALL_REDIS});
      this._store.dispatch({type: SELECT_REDIS, payload: {id}});
      this.findInstance(id).then(instance => {
        if (!instance['id']) {
          this.util.showMessage(`cannot found redis instance where id= ${id}`);
          return;
        }
        this.currentInstance = instance;
        this._store.dispatch({
          type: REQ_REDIS_CONNECT, payload: {
            instance: instance, scb: () => {
              this._store.dispatch({
                type: REQ_LOAD_ROOT_PAGE, payload: {
                  id, type, loading: true, item: [],
                  requestId: uuid(),
                }
              });
            }
          }
        });
      });
    } else if (page.type === 'data-viewer') {
      this._store.dispatch({type: REQ_LOAD_PAGE, payload: {id, type, loading: true, item: page.item}});
    }
  }

  /**
   * get short name of a redis instance
   * @param instance the redis instance
   */
  getShortName(instance) {
    return `${instance.serverModel.name}(${instance.serverModel.ip}:${instance.serverModel.port}:${instance.serverModel.db})`;
  }

  /**
   * toggle cli panel
   */
  toggleCli() {
    this._store.dispatch({type: TOGGLE_CLI});
  }

  /**
   * clear cli history
   */
  clearHistory() {
    this._store.dispatch({type: CLEAR_HISTORY});
  }


  /**
   * on Command added callback
   * @param err is command added failed
   */
  onCommandAdded(err) {
    this.onRefresh();
    setTimeout(() => {
      try {
        this.cliScrollContent.nativeElement.scrollTop = this.cliScrollContent.nativeElement.scrollHeight;
      } catch (e) {

      }
    }, 200);
  }

  /**
   * in cli input focus
   */
  onCliInputFocus() {
    this.cli$.subscribe(c => {
      if (!c.expanded && this.currentInstance) {
        this.toggleCli();
      }
    });
  }

  /**
   * on raw content click, put this raw content into input box
   * @param content the raw input content
   */
  onRawContentClick(content) {
  }


  /**
   * on cli input key down
   * @param evt the event
   */
  onCliInputKeyDown(evt) {
    if (evt.key === 'Enter') {
      const v = this.cliInputValue.trim();
      this.cliInputValue = '';
      if (v === '') { // empty input
        return;
      }

      const command = v.split(' ').filter(c => c.trim() !== ''); // combine into a command
      const id = uuid();
      this._store.dispatch({  // dispatch
        type: ADD_COMMAND, payload: {
          redisId: this.currentInstance.id,
          id,
          command,
          cb: (err) => this.onCommandAdded(err),
          item: {
            status: 'new',
            id,
            time: new Date(),
            rawCommand: v,
            command,
            result: ['running, please wait ...'],
          },
        }
      });
    }
  }
}
