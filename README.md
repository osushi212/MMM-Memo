# MMM-Memo
This an extension for the [MagicMirror²](https://magicmirror.builders/).
<br>This Module is used to add one to many memo notes on your Magic Mirror.
<br>Content is manageable through HTTP get requests.
<br>This is just draft model. You can use just addition by HTTP.

## What does it look like
<img width="604" height="735" alt="スクリーンショット 2025-09-07 002420" src="https://github.com/user-attachments/assets/27eeafa0-5f3b-4bbd-9fc3-ee4ddf7d587d" />


## Dependencies
  * An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/osushi212/MMM-Memo.git
````

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
    {
        module: 'MMM-Memo',
        position: 'top_right',
        config: {
            memofile: '/home/pi/MagicMirror/modules/MMM-Memo/memo.txt'
        }
    }
]
````
If you declare several modules in the `config/config.js` file, you will get several memo notes on your MagicMirror<sup>2</sup> profile.


## How to Use

I'm using this module with my Jarvis installation from [DomotiqueFacile](http://domotiquefacile.fr/jarvis/).
<br>When I speak to Jarvis, I say for example : "add FRUITS to the SHOPPING memo list", and Jarvis automatically sends a HTTP get request to the MMM-Memo module.
<br><br>The available HTTP get requests are the following at the moment:

### To add 'Fruits' to the 'Shopping' memo note:
````
http://MIRROR_IP:8081/memo?text=Fruits&title=Shopping
````

### To remove the second displayed memo of the 'Phone Numbers' memo note:
````
http://MIRROR_IP:MIRROR_PORT/RemoveMemo?memoTitle=phone%20numbers&item=2
````

### To remove ALL memos of the 'Phone Numbers' memo note:
````
http://MIRROR_IP:MIRROR_PORT/RemoveMemo?memoTitle=phone%20numbers&item=ALL
````

### To temporary display the second memo of the 'Shopping' memo note:
````
http://MIRROR_IP:MIRROR_PORT/DisplayMemo?memoTitle=SHOPPING&item=2
````
Memo note is displayed using the [default alert module](https://github.com/MichMich/MagicMirror/tree/master/modules/default/alert),
so it is necessary to configure this alert module in your `config/config.js` file if you want to see notifications.
<br><br>**NOTE** : I saw a problem when more than one unique MMM-Memo module is defined in the `config/config.js` file.
<br>Indeed, the same notification is displayed several times (e.g. 3 times if you defined 3 MMM-Memo modules). I did not
deeply investigate to understand the root cause.
<br>A workaround is to use the `memoDisplayNotification` property by setting it to `true` for ONLY ONE MMM-MEMO MODULE
<br>Do not forget to have ONE `memoDisplayNotification` set to `true` if you want to see notifications.


