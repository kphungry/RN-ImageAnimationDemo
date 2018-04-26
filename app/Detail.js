import React from 'react';

import { 
    View,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import SharedView from './SharedView';
import FastImage from 'react-native-fast-image';


class Detail extends React.Component{

    constructor(props) {
        super(props);

        let image = '';
        let naviState = props.navigation.state;
        if (naviState != null && naviState != undefined) {
            let params = naviState.params;
            if (params != null && params != undefined) {
                this.state = {image : params.image};
            }
        }
    }

    render(){
        return <View >
                        <SharedView name={`image-${this.state.image}`} containerRouteName='detail'>
                            <FastImage style={{width: Dimensions.get('window').width, height: Dimensions.get('window').width / 0.75}}
                                resizeMode='cover'
                                source={{uri: this.state.image}}
                                resizeMode={FastImage.resizeMode.contain}
                                />
                        </SharedView>
                    </View>
    }
}

export default Detail;
