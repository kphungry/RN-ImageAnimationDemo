

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import type {NavigationRoute } from 'react-native';

import MaterialSharedElementTransitioner from './MaterialSharedElementTransitioner';
// import CrossFadeTransitioner from './CrossFadeTransitioner';
// import AndroidDefaultTransitioner from './AndroidDefaultTransitioner';

import { createNavigationContainer, createNavigator, StackRouter, CardStack, CardStackTransitioner } from 'react-navigation';

type TransitionName = 'cardStack' | 'materialSharedElement' | 'crossFade' | 'androidDefault';

class TransitionerSwitcher extends Component {
    state: {
        transition: TransitionName,
        duration: number,
    }
    constructor(props) {
        super(props);
        this.state = {
            transition: 'materialSharedElement',
            duration: 300,
        };
    }
    render() {
        const transitionMap = {
            cardStack: CardStackTransitioner,
            materialSharedElement: MaterialSharedElementTransitioner,
            // crossFade: CrossFadeTransitioner,
            // androidDefault: AndroidDefaultTransitioner,
        }
        const Transitioner = transitionMap[this.state.transition];

        return (
            <Transitioner {...this.props} />
        );
    }
    // For simplicity, we use context to pass these functions to PhotoGridScreen and SettingsScreen
    // In real apps, we can use Redux to manage the state.
    static childContextTypes = {
        setActiveTransition: PropTypes.func,
        getActiveTransition: PropTypes.func,
    }
    getChildContext() {
        const self = this;
        return {
            setActiveTransition(transition:TransitionName) {
                self.setState({ transition });
            },
            getActiveTransition():TransitionName {
                return self.state.transition;
            }
        };
    }
}

export default TransitionerSwitcher;