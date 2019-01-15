import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AddServerDialogComponent} from './components/add-server-dialog/add-server-dialog.component';
import {RedisInstance} from './models/redis-instance';
import uuid from 'uuid';
import {RedisService} from './services/redis.service';
import {UtilService} from './services/util.service';
import {Store} from '@ngrx/store';
import { take } from 'rxjs/operators';
import {
  AddRedisServer,
  DisconnectAllRedis,
  RedisDisconnect, RemoveRedisServer, ReqFetchTree,
  ReqRedisConnect,
  SelectRedis
} from './ngrx/actions/redis-actions';
import {Observable, Subject} from 'rxjs';
import {ReqLoadPage, ReqLoadRootPage} from './ngrx/actions/page-actions';
import {PageModel} from './models/page-model';
import {AddCommand, ClearHistory, PreviewIndexUpdate, ToggleCli} from './ngrx/actions/cli-actions';
import {ConfirmDialogComponent} from './components/confirm-dialog/confirm-dialog.component';
import {InformationDialogComponent} from './components/information-dialog/information-dialog.component';
import {SettingsDialogComponent} from './components/settings-dialog/settings-dialog.component';
import {ThemeConfig} from './theme-config';
import {ImportDataDialogComponent} from './components/import-data-dialog/import-data-dialog.component';

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
  @ViewChild('cliInput') private cliInput: ElementRef;

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
      this._store.dispatch(new ReqRedisConnect({instance: instances[0]}));
    });
  }

  findInstance(id) {
    return new Promise(resolve => {
      this.instances$.subscribe(instances => {
        resolve(instances.find(ins => ins.id === id) || {});
      });
    });
  }

  findInstanceByName(name) {
    return new Promise(resolve => {
      this.instances$.subscribe(instances => {
        resolve(instances.find(ins => ins.serverModel.name === name));
      });
    });
  }

  /**
   * on add server event
   */
  onAddServer() {
    const ref = this.dialogService.open(AddServerDialogComponent, {
      width: '280px',
      data: {name: 'localhost', password: '', ip: 'localhost', port: 6379, db: 0},
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.findInstanceByName(result.name).then(instance => {
          if (instance) {
            this.util.showMessage('The instance name already exists.');
            return;
          } else {
            const newInstance = {id: uuid(), serverModel: result};
            this._store.dispatch(new AddRedisServer(newInstance));  // add new server
            this._store.dispatch(new ReqRedisConnect({instance: newInstance})); // connect
          }
        });
      }
    });
  }

  onDeleteServer() {
    if (!this.currentInstance) {
      this.util.showMessage('You need to select Redis instance first');
      return;
    }
    this.dialogService.open(ConfirmDialogComponent, {
      width: '250px', data: {
        title: 'Delete Confirmation',
        message: `Are you sure you want to delete this server?`
      }
    }).afterClosed().subscribe(ret => {
      if (ret) {
        this._store.dispatch(new RemoveRedisServer({instance: this.currentInstance})); // remove
        this._store.dispatch(new ReqLoadPage(getNewPage()));
        this.currentInstance = null;
        this.util.showMessage('Deleted successfully.');
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
        this.util.showMessage('You need to select a Redis instance first.');
        return;
      }
      this._store.dispatch( new ReqRedisConnect({
        instance: ins, scb: () => {
          if (expandNodes) {
            ins.expanded = true;
          }
          if (ins.expanded) {
            this._store.dispatch(new ReqFetchTree({
              id: ins.id, scb: () => {
                if (expandNodes) {
                  setTimeout(() => this.expandDeepCommand$.next(), 0);
                }
              }
            }));
          }
        }
      }));
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
    this.currentInstance = null;
    this._store.dispatch(new RedisDisconnect({id}));
    this._store.dispatch(new ReqLoadPage(getNewPage()));
  }

  onInformationEvt() {
    this.dialogService.open(InformationDialogComponent, {
      width: '80%',
      height: '80%'
    });
  }

  onSettingsEvt() {
    this.dialogService.open(SettingsDialogComponent, {
      width: '300px',
    });
  }

  /**
   * when user enter values and click ok to add new value for redis
   * @param newValue the new value model
   */
  onNewValue(newValue) {
    this.redisService.call(newValue.id, [newValue.rawLine]).subscribe(ret => {
      if (newValue.from === 'root') {
        this.onRefresh();
      }
      if (newValue.onSuccess) {
        newValue.onSuccess(newValue);
      }
      this.util.showMessage(newValue.edit ? 'Updated successfully.' : 'Added successfully.');
    }, e => {
      console.error(e.error.message);
      this.util.showMessage('Fail to add the value: ' + this.util.getErrorMessage(e));
    });
  }

  /**
   * on delete value (succeed)
   */
  onDeleteValue() {
    this._store.dispatch(new ReqLoadPage(getNewPage()));
  }

  /**
   * right page changed
   * @param page the page data
   */
  updatePage(page) {
    const {id, type} = page;
    if (page.type === 'root-instance') { // show server information
      this.requireId = uuid();
      this._store.dispatch(new DisconnectAllRedis());
      this._store.dispatch(new SelectRedis({id}));
      this.findInstance(id).then(instance => {
        if (!instance['id']) {
          this.util.showMessage(`The Redis instance with id: ${id} cannot be found.`);
          return;
        }
        this.currentInstance = instance;
        this._store.dispatch(new ReqRedisConnect({
          instance: instance, scb: () => {
            this._store.dispatch(new ReqLoadRootPage({
              id, type, loading: true, item: [],
              requestId: uuid(),
            }));
          }
        }));
      });
    } else if (page.type === 'data-viewer') {
      this._store.dispatch(new DisconnectAllRedis());
      this._store.dispatch(new SelectRedis({id}));
      this.findInstance(id).then(instance => {
        this.currentInstance = instance;
        this._store.dispatch(new ReqLoadPage({id, type, loading: true, item: page.item}));
      });
    }
  }

  /**
   * get short name of a redis instance
   * @param instance the redis instance
   */
  getShortName(instance) {
    return this.util.getShortName(instance);
  }

  /**
   * toggle cli panel
   */
  toggleCli() {
    this._store.dispatch(new ToggleCli());
    setTimeout(() => {
      try {
        this.cliScrollContent.nativeElement.scrollTop = this.cliScrollContent.nativeElement.scrollHeight;
      } catch (e) {

      }
    }, 200);

  }

  /**
   * clear cli history
   */
  clearHistory() {
    this._store.dispatch(new ClearHistory());
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
    if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
      const step = evt.key === 'ArrowUp' ? 1 : -1;
      this.cli$.subscribe(cliState => {
        if (!cliState.items || cliState.items.length <= 0) { // no any commands
          return;
        }
        const itemLength = cliState.items.length;

        // ignore key event in below cases
        if (cliState.previousIndex >= 0 &&
          cliState.previousIndex < itemLength &&
          this.cliInputValue.trim() !== '' &&
          cliState.items[itemLength - cliState.previousIndex - 1] &&
          cliState.items[itemLength - cliState.previousIndex - 1].rawCommand !== this.cliInputValue) {
          return;
        }

        const startIndex = cliState.previousIndex;
        let newIndex = startIndex + step;

        if (newIndex >= cliState.items.length) {
          newIndex = itemLength;
        }
        if (newIndex < 0) {
          newIndex = -1;
        }
        const item = cliState.items[itemLength - newIndex - 1];
        if (item && item.rawCommand) {
          this.cliInputValue = item.rawCommand;
          setTimeout(() => this.cliInput.nativeElement
              .setSelectionRange(item.rawCommand.length, item.rawCommand.length),
            20);
        } else {
          this.cliInputValue = '';
        }
        this._store.dispatch(new PreviewIndexUpdate({index: newIndex}));
      });
      return;
    }
    if (evt.key === 'Enter') {
      const v = this.cliInputValue.trim();
      this.cliInputValue = '';
      if (v === '') { // empty input
        return;
      }

      const command = v.split(' ').filter(c => c.trim() !== ''); // combine into a command
      const id = uuid();
      this._store.dispatch(new AddCommand({
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
          instanceId: this.currentInstance.id,
        },
      }));
    }
  }


  /**
   * on import button click
   * @param instance the redis instance
   */
  onImport(instance) {
    this.instances$.pipe(take(1)).subscribe((instances) => {
      this.dialogService.open(ImportDataDialogComponent, {
        width: '560px', data: {
          title: 'Delete Confirmation',
          message: `Are you sure you want to delete this server?`,
          opType: 'import',
          currentInstance: instance,
          instances,
        }
      });
    });
  }

  /**
   * on export button click
   * @param instance the redis instance
   */
  onExport(instance) {
    this.instances$.pipe(take(1)).subscribe((instances) => {
      this.dialogService.open(ImportDataDialogComponent, {
        width: '560px', data: {
          title: 'Delete Confirmation',
          message: `Are you sure you want to delete this server?`,
          opType: 'export',
          currentInstance: instance,
          instances,
        }
      });
    });
  }
}
