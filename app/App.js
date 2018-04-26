/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';

import { StackRouter,
    createNavigationContainer,
    createNavigator,
  StackNavigator,} 
from 'react-navigation';

import List from './List';
import Detail from './Detail';
import TransitionerSwitcher from './TransitionerSwitcher';

export const Left = ({onPress}) => (
    <TouchableOpacity style={{width: 44, height: 44,padding: 13}}
        onPress={() => onPress()}>
        <Image
            style={{width: 17, height: 17}}
            source={require('../assets/back.png')}
        />
    </TouchableOpacity>
);


const navigatorConfig = {
    initialRouteName: 'list',
    mode: 'card',
    headerMode: 'float',
    /* The header config from HomeScreen is now here */
    navigationOptions: ({navigation}) => {

        const {state, goBack} = navigation;
        if (state.params == null || state.params == undefined)
            return {
                headerStyle: {
                    backgroundColor: '#fff',
                    elevation: 0,
                    borderBottomColor: '#f5f5f5',
                },
                headerTintColor: '#3c3c3c',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    alignSelf: 'center',
                    textAlign: 'center'
                }
            };
        //else
        return {
            headerStyle: {
                backgroundColor: '#fff',
                elevation: 0,
                borderBottomColor: '#f5f5f5',
            },
            headerTintColor: '#3c3c3c',
            headerTitleStyle: {
                fontWeight: 'bold',
                alignSelf: 'center',
                textAlign: 'center'
            },
            headerLeft: (<Left onPress={goBack}/>)
        };
    },
};


const screens = {
    list: {
        screen: List,
    },
    detail: {
        screen: Detail,
    },
};

const router = StackRouter(screens,navigatorConfig);
export default App = createNavigationContainer(createNavigator(router,screens)(TransitionerSwitcher))
// StackNavigator( screens, navigatorConfig, TransitionerSwitcher);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
