'use strict';

/**
 * @ngdoc overview
 * @name scSuggestApp
 * @description
 * # scSuggestApp
 *
 * Main module of the application.
 */
angular
  .module('scSuggestApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
      $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
        })
        .when('/about', {
            templateUrl: 'views/about.html',
            controller: 'AboutCtrl'
        })
        .when('/suggest', {
          templateUrl: 'views/suggest.html',
          controller: 'SuggestCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
  });
