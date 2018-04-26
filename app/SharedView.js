// @flow

import React, { Component } from 'react';
import {
    View,
    findNodeHandle,
} from 'react-native';

import { SharedItem } from './SharedItems';
import PropTypes from 'prop-types';

class SharedView extends Component {
    _view: any;
    _item: SharedItem;
    static contextTypes = {
        registerSharedView: PropTypes.func,
        unregisterSharedView: PropTypes.func,
    };
    render() {
        // collapsable={false} is required for UIManager.measureInWindow to get the actual measurements
        // instead of undefined, see https://github.com/facebook/react-native/issues/9382
        return (
            <View collapsable={false}
                ref={c => this._view = c}
            >
                {this.props.children}
            </View>
        );
    }
    componentDidMount() {
        const { registerSharedView } = this.context;
        if (!registerSharedView) return;

        const { name, containerRouteName } = this.props;
        const nativeHandle = findNodeHandle(this._view);
        this._item = new SharedItem(
            name,
            containerRouteName,
            React.Children.only(this.props.children),
            nativeHandle,
        );
        // this._item.updateMetrics = this.updateMetrics.bind(this);
        registerSharedView(this._item);
    }

    componentWillUnmount() {
        const { unregisterSharedView } = this.context;
        if (!unregisterSharedView) return;

        const { name, containerRouteName } = this.props;
        unregisterSharedView(name, containerRouteName);
    }

    async updateMetrics() {
        const metrics = await this.measure(this._item);
        this._item.metrics = metrics;
    }
}

export default SharedView;