"use strict";angular.module("scSuggestApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch"]).config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/main.html",controller:"MainCtrl"}).when("/about",{templateUrl:"views/about.html",controller:"AboutCtrl"}).when("/suggest",{templateUrl:"views/suggest.html",controller:"SuggestCtrl"}).otherwise({redirectTo:"/"})}]),function(a){function b(){function a(){var a=Q.defer();return g("/me").then(function(b){i("/me").then(function(c){a.resolve({favorites:b,followings:c})})}),a.promise}function b(a){var b=Q.defer();return g(a).then(e).then(b.resolve,b.reject),b.promise}function c(a){var b=Q.defer();return h(a).then(d).then(b.resolve),l(5e3,500,b),b.promise}function d(a){return f(a,function(a){return g("/users/"+a.id)})}function e(a){return f(a,function(a){return h("/tracks/"+a.id)}).then(d)}function f(a,b){var c=Q.defer();return Q.all(a.filter(function(a){return!a.count||a.count>1}).map(b)).then(function(a){for(var b=[],d=0;d<a.length;d++)for(var e=a[d],f=0;f<e.length;f++){var g=e[f],h=b.filter(function(a){return a.item.id==g.id});0==h.length?b.push({id:g.id,item:g,count:1}):h[0].count++}c.resolve(b)},c.reject),c.promise}function g(a){return k(a+"/favorites")}function h(a){return k(a+"/favoriters")}function i(a){return k(a+"/followings")}function j(){var a=Q.defer();return SC.connect(function(){a.resolve()}),l(5e3,500,a,j),a.promise}function k(a){var b=Q.defer();return SC.get(a,function(a){b.resolve(a)}),l(5e3,500,b,a),b.promise}function l(a,b,c,d){var e=0;!function f(){return e>a/b?void c.reject("Timeout: "+d):(e++,void setTimeout(f,b))}()}var m={get:k,getMyData:a,getFavorites:g,getFavoriters:h,getFollowings:i,getFavoritesForTrackFavoriters:c,getFavoriterFavoritesForUserFavorites:b,connect:j};return m}a.qsc=b()}(window),angular.module("scSuggestApp").controller("MainCtrl",["$scope","$timeout",function(a,b){function c(){SC.initialize({client_id:"747e72b7a1a64556d542a254e330fcc0",redirect_uri:"http://MalvinButterfinger.github.io/sc-suggest/callback.html"})}function d(){qsc.connect().then(qsc.getMyData).then(function(b){a.connected=!0,a.myTracks=b.favorites,a.myFollowings=b.followings})}function e(){a.hasResults=!1,b(function(){qsc.getFavoriterFavoritesForUserFavorites("/me").then(function(b){b.sort(function(a,b){return b.count-a.count}),a.hasResults=!0,a.suggested=b.filter(function(b){return 0==a.myTracks.filter(function(a){return a.id==b.id}).length&&0==a.myFollowings.filter(function(a){return a.id==b.item.user.id}).length}).map(function(a,b){return{rank:b,status:"",info:a.item.user.username+" - "+a.item.title,purl:a.item.permalink_url,url:"https://w.soundcloud.com/player/?url="+a.item.permalink_url,count:a.count,id:a.id}}),a.$apply()})})}function f(c){c&&b(function(){angular.element("#widget-iframe").attr("src",a.suggested[0].url),j.widget=j.widget||SC.Widget("widget-iframe"),i()})}function g(b){a.currentItem.status="",a.currentPosition=b,i()}function h(){a.hasResults&&(a.currentItem.status="",a.currentPosition++,a.currentPosition==a.suggested.length&&(a.currentPosition=0),i())}function i(){a.currentItem=a.suggested[a.currentPosition],a.currentItem.status="playing",j.widget.load(a.currentItem.purl,{auto_play:!0}),j.widget.bind(SC.Widget.Events.FINISH,function(a){1==a.relativePosition&&h()})}var j=this;a.connect=d,a.getTracks=e,a.next=h,a.connected=!1,a.hasResults=!1,a.show="tracks",a.currentPosition=0,a.currentItem={},a.playTrack=g,a.showTracks=function(){return"tracks"==a.show},c(),a.$watch("hasResults",f),a.safeApply=function(a){var b=this.$root.$$phase;"$apply"==b||"$digest"==b?a&&"function"==typeof a&&a():this.$apply(a)}}]);