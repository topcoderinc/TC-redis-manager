import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {LoadingBarHttpClientModule} from '@ngx-loading-bar/http-client';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatCheckboxModule} from '@angular/material';
import {MatButtonModule} from '@angular/material';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {InstanceTreeComponent} from './components/instance-tree/instance-tree.component';
import {AddServerDialogComponent} from './components/add-server-dialog/add-server-dialog.component';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {RedisService} from './services/redis.service';
import {HttpHelperService} from './services/http-helper.service';
import {InstanceRootPanelComponent} from './components/instance-root-panel/instance-root-panel.component';
import {ConfirmDialogComponent} from './components/confirm-dialog/confirm-dialog.component';
import {AddValueDialogComponent} from './components/add-value-dialog/add-value-dialog.component';
import {AddValueFormComponent} from './components/add-value-form/add-value-form.component';
import {DataViewerComponent} from './components/data-viewer/data-viewer.component';
import {TreeNodeComponent} from './components/tree-node/tree-node.component';
import {ImportDataDialogComponent} from './components/import-data-dialog/import-data-dialog.component';
import { InformationDialogComponent } from './components/information-dialog/information-dialog.component';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';

import {RedisEffect} from './ngrx/effects/redis-effect';
import {PageEffect} from './ngrx/effects/page-effect';
import {CliEffect} from './ngrx/effects/cli-effect';
import {reducer as redisReducer} from './ngrx/reducer/redis-reducer';
import {reducer as pageReducer} from './ngrx/reducer/page-reducer';
import {reducer as cliReducer} from './ngrx/reducer/cli-reducer';
import {SettingsDialogComponent} from './components/settings-dialog/settings-dialog.component';



@NgModule({
  declarations: [
    AppComponent,
    InstanceTreeComponent,
    AddServerDialogComponent,
    InstanceRootPanelComponent,
    ConfirmDialogComponent,
    AddValueDialogComponent,
    AddValueFormComponent,
    DataViewerComponent,
    TreeNodeComponent,
    ImportDataDialogComponent,
    InformationDialogComponent,
    SettingsDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    LoadingBarHttpClientModule,
    BrowserAnimationsModule,
    MatCheckboxModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatStepperModule,
    MatTabsModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    StoreModule.forRoot({
      redis: redisReducer,
      page: pageReducer,
      cli: cliReducer,
    }),
    EffectsModule.forRoot([RedisEffect, PageEffect, CliEffect]),
  ],
  providers: [
    HttpHelperService,
    RedisService,
    {provide: MAT_DIALOG_DEFAULT_OPTIONS , useValue: {disableClose: true, hasBackdrop: true}}
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ConfirmDialogComponent,
    AddValueDialogComponent,
    AddServerDialogComponent,
    ImportDataDialogComponent,
    InformationDialogComponent,
    SettingsDialogComponent,
  ],
})
export class AppModule {
}
