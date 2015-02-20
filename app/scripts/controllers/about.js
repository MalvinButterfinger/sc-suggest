'use strict';

/**
 * @ngdoc function
 * @name scSuggestApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the scSuggestApp
 */
angular.module('scSuggestApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
