import React from 'react';
import { Util } from '../../stationx/util';
import { Event, LoadingStatus, PortletKeys, PortletState, RequestIDs } from '../../stationx/station-x';
import Button from '@clayui/button';
import Icon from '@clayui/icon';
import SXBaseVisualizer from '../../stationx/visualizer';
import Panel from '@clayui/panel';
import { Body, Cell, Head, Row, Table, Text } from '@clayui/core';
import { SXUpgradeIcon } from '../../stationx/icon';
import { SXModalDialog, SXModalUtil } from '../../stationx/modal';

class SXSetInfo extends React.Component {
  constructor(props) {
    super(props);

    //console.log("[SXSetInfo props] ", props);
    this.namespace = props.namespace;
    this.formId = props.formId;

    this.setId = props.setId;
    this.setCode = props.setCode;
    this.setVersion = props.setVersion;
    this.displayName = props.displayName;
    this.description = props.description;
    this.verified = props.verified ?? { verified: false };
    this.freezed = props.freezed ?? { freezed: false };
    this.spritemap = props.spritemap;
  }

  render() {
    return (
      <>
        <Text weight="bold" size="1.0rem">
          {Util.translate('field-values')}
        </Text>
        <Table columnsVisibility={false} borderedColumns={false} size="sm" hover={false} striped={false}>
          <Head
            items={[
              { columnName: 'columnName', value: Util.translate('field-name'), width: '7rem' },
              {
                columnName: 'columnValue',
                value: Util.translate('value'),
                className: 'table-cell-expand'
              }
            ]}
          >
            {(headItem) => (
              <Cell
                key={headItem.columnName}
                className={headItem.className}
                width={headItem.width}
                textAlign="center"
                style={{ fontWeight: 'bold', fontSize: '1.0rem' }}
              >
                {headItem.value}
              </Cell>
            )}
          </Head>
          <Body
            defaultItems={[
              { fieldName: Util.translate('id'), fieldValue: this.setId },
              { fieldName: Util.translate('code'), fieldValue: this.setCode },
              { fieldName: Util.translate('version'), fieldValue: this.setVersion },
              { fieldName: Util.translate('description'), fieldValue: this.description },
              {
                fieldName: Util.translate('verify'),
                fieldValue: this.verified.verified ? Util.translate('verified') : Util.translate('unverified')
              },
              {
                fieldName: Util.translate('freeze'),
                fieldValue: this.freezed.freezed ? Util.translate('freezed') : Util.translate('unfreezed')
              }
            ]}
          >
            {(row, index) => (
              <Row key={index}>
                <Cell>
                  <Text size={3}>
                    <span style={{ fontWeight: 'bold' }}>{row.fieldName}</span>
                  </Text>
                </Cell>
                <Cell>
                  <Text size={3}>{row.fieldValue}</Text>
                </Cell>
              </Row>
            )}
          </Body>
        </Table>
      </>
    );
  }
}

class DataSetViewer extends SXBaseVisualizer {
  dataCollectionId = 0;
  dataSetId = 0;
  dataSetCode = '';
  dataSetVersion = '1.0.0';
  displayName;
  description;
  dataSetList = [];
  verified = {};
  freezed = {};
  histories = [];
  comments = [];
  statistics = {};

  constructor(props) {
    super(props);

    //console.log("[DataSetViewer props] ", props);

    this.dataCollectionId = this.params.dataCollectionId ?? 0;
    this.dataCollectionDisplayName = this.params.dataCollectionDisplayName ?? '';
    this.dataSetId = this.params.dataSetId ?? 0;

    this.displayInfo = this.params.displayInfo ?? true;
    this.displayVerified = this.params.displayVerified ?? true;
    this.displayFreezed = this.params.displayFreezed ?? true;
    this.displayHistories = this.params.displayHistories ?? true;
    this.displayComments = this.params.displayComments ?? true;
    this.displayStatistics = this.params.displayStatistics ?? true;

    this.state = {
      infoDialog: false,
      dialogHeader: <></>,
      dialogBody: <></>,
      loadingStatus: LoadingStatus.PENDING
    };

    this.buttons = [
      {
        id: 'edit',
        label: Util.translate('edit'),
        symbol: 'pencil'
      }
    ];
  }

  listenerWorkbenchReady = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataSetViewer] listenerWorkbenchReady event rejected: ", event.dataPacket);
      return;
    }

    //console.log("[DataSetViewer] listenerWorkbenchReady received: ", event.dataPacket);

    this.fireRequest({
      requestId: RequestIDs.viewDataSet,
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId
      }
    });
  };

  listenerResponse = (event) => {
    const { targetPortlet, requestId, params, data } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataSetViewer] listenerResponce rejected: ", event.dataPacket);
      return;
    }

    //console.log("[DataSetViewer] listenerResonse: ", requestId, params, data);
    const { error } = data;
    if (error) {
      this.setState({
        dialogHeader: SXModalUtil.errorDlgHeader(this.spritemap),
        dialogBody: error,
        infoDialog: true
      });

      return;
    }

    switch (requestId) {
      case RequestIDs.viewDataSet: {
        const {
          dataSetId,
          dataSetCode,
          dataSetVersion,
          displayName,
          description,
          dataTypeList,
          verified,
          freezed,
          histories,
          comments,
          statistics
        } = data;

        this.dataSetId = dataSetId;
        this.dataSetCode = dataSetCode;
        this.dataSetVersion = dataSetVersion;
        this.displayName = displayName;
        this.description = description;
        this.dataTypeList = dataTypeList;
        this.verified = verified ?? { verified: false };
        this.freezed = freezed ?? { freezed: false };
        this.histories = histories;
        this.comments = comments;
        this.statistics = statistics;

        this.setState({
          loadingStatus: LoadingStatus.COMPLETE
        });

        break;
      }
    }
  };

  listenerComponentWillUnmount = (event) => {
    const { targetPortlet } = event.dataPacket;

    if (targetPortlet !== this.namespace) {
      //console.log("[DataSetViewer] listenerComponentWillUnmount rejected: ", event.dataPacket);
      return;
    }

    //console.log("[DataSetViewer] listenerComponentWillUnmount received: ", event.dataPacket);
    this.componentWillUnmount();
  };

  componentDidMount() {
    Event.on(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.on(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.on(Event.SX_RESPONSE, this.listenerResponse);

    this.fireHandshake();
  }

  componentWillUnmount() {
    Event.off(Event.SX_COMPONENT_WILL_UNMOUNT, this.listenerComponentWillUnmount);
    Event.off(Event.SX_WORKBENCH_READY, this.listenerWorkbenchReady);
    Event.off(Event.SX_RESPONSE, this.listenerResponse);
  }

  handleButtonClick = (button) => {
    const portletName = button.id === 'edit' ? PortletKeys.DATASET_EDITOR : PortletKeys.DATATYPE_EDITOR;

    Event.fire(Event.SX_LOAD_PORTLET, this.namespace, this.workbenchNamespace, {
      portletName: portletName,
      portletState: PortletState.NORMAL,
      params: {
        dataCollectionId: this.dataCollectionId,
        dataSetId: this.dataSetId
      }
    });
  };

  render() {
    //console.log("[DataSetViewer render] ", JSON.stringify(this.dataTypeList, null, 4));
    return (
      <>
        <Panel
          collapsable
          displayTitle={
            <div className="autofit-row autofit-padding">
              <div className={'autofit-col autofit-col-expand'}>
                <Text size={5} weight="semi-bold">
                  {Util.translate('basic-information')}
                </Text>
              </div>
              <div className="autofit-col">
                {this.buttons.length > 0 && (
                  <Button.Group spaced style={{ height: '1.0rem', marginRight: '10px' }}>
                    {this.buttons.map((button) => (
                      <Icon
                        key={button.id}
                        symbol={button.symbol}
                        onClick={(event) => {
                          event.stopPropagation();
                          this.handleButtonClick(button);
                        }}
                        style={{
                          width: '1.0rem',
                          height: '100%'
                        }}
                        spritemap={this.spritemap}
                      />
                    ))}
                    <SXUpgradeIcon />
                  </Button.Group>
                )}
              </div>
            </div>
          }
          displayType="secondary"
          showCollapseIcon={true}
          defaultExpanded={true}
          spritemap={this.spritemap}
        >
          <Panel.Body>
            <div className="autofit-padded-no-gutters-x autofit-row" style={{ alignItems: 'start' }}>
              <div className="autofit-col autofit-col-shrink">
                <SXSetInfo
                  key={this.dataSetCode}
                  namespace={this.namespace}
                  formId={this.componentId}
                  setId={this.dataSetId}
                  setCode={this.dataSetCode}
                  setVersion={this.dataSetVersion}
                  displayName={this.displayName}
                  description={this.description}
                  verified={this.verified}
                  freezed={this.freezed}
                  spritemap={this.spritemap}
                />
              </div>
              <div className="autofit-col autofit-col-expand">
                <Text weight="bold" size="1.0rem">
                  {Util.translate('datatypes')}
                </Text>
                <Table key={Util.randomKey()} columnsVisibility={false} borderedColumns={false} size="sm" hover={false}>
                  <Head
                    items={[
                      {
                        id: 'name',
                        name: Util.translate('display-name'),
                        width: 'auto'
                      },
                      {
                        id: 'code',
                        name: Util.translate('code'),
                        width: 'auto'
                      },
                      {
                        id: 'version',
                        name: Util.translate('version'),
                        width: '5rem'
                      }
                    ]}
                  >
                    {(column) => (
                      <Cell textAlign="center" width={column.width}>
                        {column.name}
                      </Cell>
                    )}
                  </Head>
                  <Body key={this.dataTypeList} defaultItems={this.dataTypeList}>
                    {(row) => (
                      <Row>
                        <Cell textAlign="center">{row.displayName}</Cell>
                        <Cell textAlign="center">{row.dataTypeCode}</Cell>
                        <Cell textAlign="center">{row.dataTypeVersion}</Cell>
                      </Row>
                    )}
                  </Body>
                </Table>
              </div>
            </div>
          </Panel.Body>
        </Panel>
        <Panel
          collapsable
          displayTitle={<Text size={5}>{Util.translate('data-status')}</Text>}
          displayType="secondary"
          showCollapseIcon={true}
          defaultExpanded={true}
          spritemap={this.spritemap}
        >
          <Panel.Body>
            <div className="autofit-padded-no-gutters-x autofit-row" style={{ alignItems: 'start' }}>
              <div className="autofit-col autofit-col-expand">
                <Text weight="bold" size="1.0rem">
                  {Util.translate('verified-status')}
                </Text>
              </div>
              <div className="autofit-col autofit-col-expand">
                <Text weight="bold" size="1.0rem">
                  {Util.translate('freezed-status')}
                </Text>
              </div>
            </div>
          </Panel.Body>
        </Panel>
        <Panel
          collapsable
          displayTitle={<Text size={5}>{Util.translate('comments-and-histories')}</Text>}
          displayType="secondary"
          showCollapseIcon={true}
          defaultExpanded={true}
          spritemap={this.spritemap}
        >
          <Panel.Body>
            <div className="autofit-padded-no-gutters-x autofit-row" style={{ alignItems: 'start' }}>
              <div className="autofit-col autofit-col-expand">
                <Text weight="bold" size="1.0rem">
                  {Util.translate('comments')}
                </Text>
              </div>
              <div className="autofit-col autofit-col-expand">
                <Text weight="bold" size="1.0rem">
                  {Util.translate('histories')}
                </Text>
              </div>
            </div>
          </Panel.Body>
        </Panel>
        {this.state.infoDialog && (
          <SXModalDialog
            header={this.state.dialogHeader}
            body={this.state.dialogBody}
            buttons={[
              {
                label: Util.translate('ok'),
                onClick: () => {
                  this.setState({ infoDialog: false });
                }
              }
            ]}
          />
        )}
      </>
    );
  }
}

export default DataSetViewer;
