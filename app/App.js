/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Alert, WebView} from 'react-native'

export default class App extends Component {
  render () {
    return (
      <WebView
        source={{uri: 'http://localhost:3000/view/card'}}
        style={{marginTop: 20}}
        onNavigationStateChange={(navigation) => {
          console.log('navigation', navigation)
          if (navigation.loading) {
            return false
          }
          if (navigation.url.startsWith('https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout') &&
          navigation.url.indexOf('#/checkout/selectFi') !== -1) {
            Alert.alert(
              navigation.title,
              `Confirm to goto ${navigation.url}`,
              [
                {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel'
                },
                {text: 'OK', onPress: () => console.log('OK Pressed')}
              ],
              {cancelable: false}
            )
          } else if (navigation.url.startsWith('https://hpp.sandbox.realexpayments.com/result.html')) {
            Alert.alert(
              navigation.title,
              `Transaction done.`,
              [
                {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel'
                },
                {text: 'OK', onPress: () => console.log('OK Pressed')}
              ],
              {cancelable: false}
            )
          }
        }}
      />
    )
  }
}
