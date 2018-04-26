// @flow
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    View,
    StyleSheet,
    Animated,
    Text,
    Dimensions,
    UIManager,
    InteractionManager,
    Easing,
} from 'react-native';

import {Transitioner, addNavigationHelpers, CardStack} from 'react-navigation';

import type {NavigationTransitionProps} from 'NavigationTypeDefinition';

import SharedItems from './SharedItems';

import type {Metrics, SharedItem} from './SharedItems';


type State = {
    animateItems: SharedItems,
    itemsToMeasure: Array<SharedItem>,
}

class MagnifyAnimationObject {
    item : SharedItem;
    startRect: Metrics;
    endRect: Metrics;
    constructor(item : SharedItem,startRect: Metrics,endRect: Metrics){
        this.item = item;
        this.startRect = startRect;
        this.endRect = endRect;
    }
}

class MaterialSharedElementTransitioner extends Component {
    state: State;
    static childContextTypes = {
        registerSharedView: PropTypes.func,
        unregisterSharedView: PropTypes.func,
    }

    constructor(props) {
        super(props);
        this.state = {
            animatedItems: new SharedItems(),
            itemsToMeasure: [],
        };
    }

    measure(sharedItem: SharedItem): Promise<Metrics> {
        // console.log('measuring:', sharedItem.name, sharedItem.containerRouteName)
        return new Promise((resolve, reject) => {
            UIManager.measureInWindow(
                sharedItem.nativeHandle,
                (x, y, width, height) => {
                    resolve({x, y, width, height});
                }
            );
        });
    }

    setSharedItemsState(fun: (prevState: State) => SharedItems, callback) {
        this.setState((prevState) => (
            {animatedItems: fun(prevState)}
        ), callback);
    }

    addSharedItem(sharedItem: SharedItem) {
        this.setSharedItemsState(prevState =>
            prevState.animatedItems.add(sharedItem)
        );
    }

    removeSharedItem(name: string, containerRouteName: string) {
        this.setSharedItemsState(prevState =>
            prevState.animatedItems.remove(name, containerRouteName)
        );
    }

    getChildContext() {
        const self = this;
        return {
            registerSharedView(sharedItem: SharedItem) {
                self.addSharedItem(sharedItem);
                const {name, containerRouteName} = sharedItem;

                const matchingItem = self.state.animatedItems.findMatchByName(name, containerRouteName);
                // schedule to measure (on layout) if another view with the same name is mounted
                if (matchingItem) {
                    self.setState((prevState: State) => ({
                        animatedItems: prevState.animatedItems,
                        itemsToMeasure: [...prevState.itemsToMeasure, sharedItem, matchingItem]
                    }));
                }
            },
            unregisterSharedView(name: string, containerRouteName: string) {
                self.removeSharedItem(name, containerRouteName);
            },
        };
    }

    shouldComponentUpdate(nextProps, nextState: State) {
        /*
         state / prop changes
         - navigation change: nextProps !== this.props                       => true
         - onLayout: state: itemsToMeasure, animatedItems.metrics              => measured?
         - afterInteraction: state: itemsToMeasure, sharedElements.metrics   => false
         - register: state.sharedElements, state.itemsToMeasure              => false
         - unregister: statee.sharedElements                                 => false
         */
        return this.props !== nextProps || nextState.itemsToMeasure.length === 0;
    }

    async _onLayout() {
        let toUpdate = [];
        for (let item of this.state.itemsToMeasure) {
            const {name, containerRouteName} = item;
            const metrics = await this.measure(item);
            toUpdate.push({name, containerRouteName, metrics});
        }
        if (toUpdate.length > 0) {
            console.log('measured, setting meatured state:', toUpdate);
            this.setState((prevState: State): State => ({
                animatedItems: prevState.animatedItems.updateMetrics(toUpdate),
                itemsToMeasure: [],
            }));
        }
    }

    /*for redux*/
    getStateForAction() {

    }

    render() {
        return (
            //onTransitionStart={this.props.onTransitionStart}
            // onTransitionEnd={this.props.onTransitionEnd}
            <Transitioner
                configureTransition={this._configureTransition.bind(this)}
                render={this._render.bind(this)}
                navigation={this.props.navigation}
                style={[this.props.style]}

            />
        );
    }

    _configureTransition() {
        return {
            duration: 300,
            // useNativeDriver: false,
        };
    }

    _render(props: NavigationTransitionProps, prevProps: NavigationTransitionProps) {

        const overlay = this._renderOverlay2(props, prevProps);

        const transitionConfig1 = () => {
            return {
                transitionSpec: {
                    duration: 300,
                    easing: Easing.out(Easing.poly(4)),
                    timing: Animated.timing,
                    useNativeDriver: true,
                },
                screenInterpolator: sceneProps => {
                    const {layout, position, scene} = sceneProps;

                    const thisSceneIndex = scene.index;
                    const width = layout.initWidth;

                    const opacity = position.interpolate({
                        inputRange: [thisSceneIndex - 1, thisSceneIndex - 0.01, thisSceneIndex],
                        outputRange: [0, 0, 1],
                    });

                    return {opacity};
                },
            };
        };
        const {
            screenProps,
            headerMode,
            headerTransitionPreset,
            mode,
            router,
            cardStyle,
            transitionConfig,
        } = this.props;
        let config = overlay ? transitionConfig1: transitionConfig;
        return (
            <View style={styles.scenes}>
                <CardStack
                    screenProps={screenProps}
                    headerMode={headerMode}
                    headerTransitionPreset={headerTransitionPreset}
                    mode={mode}
                    router={router}
                    cardStyle={cardStyle}
                    transitionConfig={config}
                    transitionProps={props}
                    prevTransitionProps={prevProps}
                />
                {overlay}
            </View>
        );
    }

    _getOverlayContainerStyle(progress) {
        const left = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100000], // move it off screen after transition is done
        });
        return {
            left,
        };
    }

    _getSharedElementStyle(props, prevProps, animationObj) {
        const {position, progress, index} = props;

        const getElementType = (item) => {
            const type = item.reactElement.type;
            return type && (type.displayName || type.name);
        };
        const animateWidthHeight = (animationObj) => {
            const width = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [animationObj.startRect.width, animationObj.endRect.width],
            });
            const height = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [animationObj.startRect.height, animationObj.endRect.height],
            });
            return {width, height};
        };

        const animateScale = (animationObj) => {

            const toVsFromScaleX = animationObj.endRect.width / animationObj.startRect.width;
            const toVsFromScaleY = animationObj.endRect.height / animationObj.startRect.height;
            // using progress is actually much simpler than position in previous implementation.
            const scaleX = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, toVsFromScaleX]
            });
            const scaleY = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, toVsFromScaleY]
            });
            const left = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [animationObj.startRect.x, animationObj.endRect.x + animationObj.startRect.width / 2 * (toVsFromScaleX - 1)],
            });
            const top = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [animationObj.startRect.y, animationObj.endRect.y + animationObj.startRect.height / 2 * (toVsFromScaleY - 1)],
            });

            const opacity = progress.interpolate({
                inputRange: [0,0.1,0.95, 1],
                outputRange: [0.5,1.0,1.0,0.5],
            });

            return {
                left,
                top,
                transform: [
                    {scaleX}, {scaleY}
                ],
                opacity
            };
        };

        const elementType = getElementType(animationObj.item);
        let style;
        switch (elementType) {
        case 'Image':
            style = animateWidthHeight(animationObj);
            break;
        case 'FastImage':
            style = animateWidthHeight(animationObj);
            break;
        default:
            style = animateScale(animationObj);
        }
        

        const left = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [animationObj.startRect.x, animationObj.endRect.x],
        });
        const top = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [animationObj.startRect.y, animationObj.endRect.y],
        });

        return {
            // elevation: this._interpolateElevation(props, prevProps, 1), // make sure shared elements stay above the faked container
            position: 'absolute',
            left,
            top,
            right: null,
            bottom: null,
            ...style,
        };
    }

    _getBBox(metricsArray: Array<Metrics>) {
        let left, top, right, bottom;
        left = top = Number.MAX_VALUE;
        right = bottom = Number.MIN_VALUE;
        metricsArray.forEach(m => {
            if (m.x < left) left = m.x;
            if (m.y < top) top = m.y;
            if (m.x + m.width > right) right = m.x + m.width;
            if (m.y + m.height > bottom) bottom = m.y + m.height;
        });
        const width = right - left;
        const height = bottom - top;
        return {left, top, right, bottom, width, height};
    }

    _interpolateElevation(props, prevProps, base: number) {
        const {position, index} = props;
        const prevIndex = !prevProps? 0 : prevProps.index;
        const minIdx = Math.min(index, prevIndex);
        const maxIdx = Math.max(index, prevIndex);

        return position.interpolate({
            inputRange: [minIdx, maxIdx],
            outputRange: [5 + base, 25 + base],
        });
    }

    _renderFakedSEContainer(animationObjs, props, prevProps) {
        if (!prevProps || !animationObjs ) return null;

        const fromItemBBox = this._getBBox(animationObjs.map(p => p.startRect));
        const toItemBBox = this._getBBox(animationObjs.map(p => p.endRect));
        const {position, progress, index} = props;
        const prevIndex = prevProps.index;
        const minIdx = Math.min(index, prevIndex);
        const maxIdx = Math.max(index, prevIndex);
        const inputRange = [minIdx, maxIdx];
        const adaptRange = (range) => index > prevIndex ? range : range.reverse();
        const left = position.interpolate({
            inputRange,
            outputRange: adaptRange([fromItemBBox.left, toItemBBox.left]),
        });
        const top = position.interpolate({
            inputRange,
            outputRange: adaptRange([fromItemBBox.top, toItemBBox.top]),
        });
        const {height: windowHeight, width: windowWidth} = Dimensions.get('window');
        const width = position.interpolate({
            inputRange,
            outputRange: [index > prevIndex ? fromItemBBox.width : toItemBBox.width, windowWidth],
        });
        const height = position.interpolate({
            inputRange,
            outputRange: [index > prevIndex ? fromItemBBox.height : toItemBBox.height, windowHeight],
        });
        const elevation = this._interpolateElevation(props, prevProps, 0);
        const style = {
            backgroundColor: '#e2e2e2',
            // elevation,
            position: 'absolute',
            left,
            top,
            right: null,
            bottom: null,
            width,
            height,
        };
        return <Animated.View style={style}/>;
    }
    
    _renderOverlay2(props: NavigationTransitionProps, prevProps: NavigationTransitionProps) {

        const animatedObject = this.getAnimatedObject(props) ;//this.state.animatedItems.getMeasuredItemPairs(fromRoute, toRoute);
        if (!animatedObject || !prevProps ) return null;
        if (props.navigation.state.index === prevProps.navigation.state.index) return null;
        const animatedStyle = this._getSharedElementStyle(props, prevProps, animatedObject);
        const element = animatedObject.item.reactElement;
        const AnimatedComp = Animated.createAnimatedComponent(element.type);
        let sharedElements = React.createElement(AnimatedComp,
            {...element.props, style: [element.props.style, animatedStyle]},
            element.props.children);

        const {position, scene} = props;
        const {index} = scene;
        const inputRange = [index - 1,index - 0.99, index - 0.001, index]; //, index + 0.99, index + 1
        const left = position.interpolate({
            inputRange,
            outputRange: [10000,0.0,0.0,10000], //, 0.75, 0.99
        });
        const containerStyle = {left};

        return (
            <Animated.View style={[styles.overlay, this.props.style, containerStyle]}>
                {sharedElements}
            </Animated.View>
        );
    }

    getAnimatedObject(props) {
        let params= props.scene.route.params;
        if (params && params['imageTransition']){
            let rect1 = params['frame1'];
            let rect2 = params['frame2'];
            let animationViewId = params['animationViewId'];
            let itemView = this.state.animatedItems._items.filter( ele => ele.name == animationViewId );
            return new MagnifyAnimationObject(itemView[0],rect1,rect2);
        }
        return null;
    }

    _renderDarkeningOverlay(progress, position, sceneIndex: number) {
        const backgroundColor = position.interpolate({
            inputRange: [sceneIndex - 1, sceneIndex, sceneIndex + 0.2, sceneIndex + 1],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)'],
        });
        const animatedStyle = {
            // elevation: 5, // to ensure the overlay covers toolbar
            backgroundColor,
            ...this._getOverlayContainerStyle(progress)
        };
        return <Animated.View style={[styles.overlay, animatedStyle]}/>;
    }

}

const styles = StyleSheet.create({
    scenes: {
        flex: 1,
    },
    scene: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 10000, // invisible by default
        right: 0,
        bottom: 0,
        zIndex: 990,
        backgroundColor:'#ffffff99'
    }
});

export default MaterialSharedElementTransitioner;