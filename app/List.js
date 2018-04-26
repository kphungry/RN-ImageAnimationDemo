/* @flow */

import React from 'react';

import {
    TouchableWithoutFeedback,
    StyleSheet,
    View,
    Image,
    Text,
    Dimensions,
    FlatList,
    ActivityIndicator,
    findNodeHandle,
    UIManager
} from 'react-native';
import {SafeAreaView} from 'react-navigation';
import SharedView from './SharedView';
import FastImage from 'react-native-fast-image';

const _images = ["https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68250040/64d645f241295c7394386ccc821f9350.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68250020/0d361e9d02b8fd3c5589ece320cb0cb1.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209150/ada71d156e80a12a72b1da3cf3ef2126.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68250030/33572235a8d603f1e985a8b77fdee439.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209060/9f0376a6ce9653bcf89242b1373df6c9.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209050/5c979a85c11eed4b50b3a8c5cadf10b4.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209040/9ba8e62243fe009719f050dfdcb69272.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209030/dbd32e618c62caf3acdeb23392010e28.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209020/79661ca75ee47ab7444e0c0618266b69.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68208010/1c1105e7c15113372a6f7f406885e575.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68206010/160bcbbe77a71c28f6c769efd0a17b4b.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68284010/3299d51ab1da999d0468aa7e8b603d3f.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68206210/8bc22df9c82693993e661da4373a70c5.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68205010/b07512938652a6be2672294de24fba6c.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68204010/9a388f41257888d02c87b96e9be53190.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68251010/84a16a0604b7c894fd0ac7811d96a9b1.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68250070/ae057a0c7c839549d067e8b4cae13acd.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68250060/39ae805ced70b5f30f8bbe547e72a164.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209160/c1e9d02aee4fa141a92748420cb14329.jpg!ee", "https://o2o-uploaded-images.b0.upaiyun.com/product/image/AM/68209070/7b53a96f3791813ea4fec01bc0bc5975.jpg!ee"];

class List extends React.Component {

    _imgViews = {};
    _topInset = 64;
    _underNavigationHandle: any;

    constructor(props) {
        super(props);

        this.state = {
            list: _images,
        };
    }

    _oneItem = data => {
      let width = Dimensions.get('window').width;
      let self = this;
        return <TouchableWithoutFeedback
                ref={c => self._imgViews['img-'+data.item] = c}
                onPress={() => {
                    const nativeHandle = findNodeHandle(self._imgViews['img-'+data.item]);
                    let frame2 = {x:0,y:self._topInset, width:width, height:width*4/3};
                    self.measure(nativeHandle).then(frame1 => {

                        self.props.navigation.navigate('detail', {
                            image: data.item,
                            imageTransition: true,
                            frame1: frame1,
                            frame2: frame2,
                            animationViewId: 'img-'+data.item,
                        });
                    });
                }}>

                <View>
                    <SharedView name={`img-${data.item}`} containerRouteName='list'>
                        <FastImage style={{width: width/2-10, 
                            height: (width/2-10)*1.33,
                            margin:5,}} 
                        source={{uri: data.item}} 
                        resizeMode={FastImage.resizeMode.contain}/>
                    </SharedView>
                </View>
            </TouchableWithoutFeedback> ;
    };

    render() {
        return (
            <SafeAreaView forceInset={{horizontal: 'always'}}
                style={{backgroundColor:'white'}}>
                <View style={{width:'100%',height:1,backgroundColor:'white'}}
                    ref={ v => this._underNavigationHandle = v }
                    onLayout={this._onLayout.bind(this)}/>
                <FlatList numColumns={2}  /* eslint-disable indent */
                          data={this.state.list}
                          renderItem={this._oneItem}
                          keyExtractor={(item, index) => {
                              return index;
                          }}
                />
            </SafeAreaView>
        );
    }

    measure(nativeHandle: any): Promise<Metrics> {
        // console.log('measuring:', sharedItem.name, sharedItem.containerRouteName)
        return new Promise((resolve, reject) => {
            UIManager.measureInWindow(
                nativeHandle,
                (x, y, width, height) => {
                    resolve({ x, y, width, height });
                }
            );
        });
    }

    _onLayout(){
        this.measure(findNodeHandle(this._underNavigationHandle))
            .then( rect =>{
                this._topInset = rect.y;
            } );
    }
}

export default List;
