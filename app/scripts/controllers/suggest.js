'use strict';

/**
 * @ngdoc function
 * @name scSuggestApp.controller:SuggestCtrl
 * @description
 * # SuggestCtrl
 * Controller of the scSuggestApp
 */
angular.module('scSuggestApp')
  .controller('SuggestCtrl', function ($scope, $sce) {
    $scope.username = "";
    $scope.favorites = [];
    $scope.favoriters = [];
    $scope.users = [];

    SC.initialize({
        client_id: '747e72b7a1a64556d542a254e330fcc0',
        redirect_uri: 'http://localhost:9000/callback.html'
    });

    // initiate auth popup
    SC.connect(function () {
        SC.get('/me', function (me) {
            $scope.username = me.username;
            //$scope.superTracks = get('/me', 1);
            SC.get('/me/favorites', function (favorites) {
                favorites.forEach(function (f) {
                    $scope.favorites.push({ title: f.title, id: f.id });
                    SC.get('/tracks/' + f.id + '/favoriters', function (favoriters) {
                        favoriters.forEach(function (fer) {
                            $scope.favoriters.push({ track: f.title, trackid:f.id, user: { name: fer.username, id: fer.id } });
                        });
                        f.processed = true;
                    });
                });
                (function loadTracksIfReady() {
                    var ready = true;
                    for (var i = 0; i < favorites.length; i++) {
                        if (!favorites[i].processed) {
                            ready = false;
                            break;
                        }
                    }
                    if (ready) {
                        var users = $scope.favoriters.reduce(function (acc, curr) {
                            var it = acc.filter(function (x) { return x.id == curr.user.id; });
                            if (it.length == 0) {
                                acc.push({ id: curr.user.id, name: curr.user.name, tracknames: curr.track, trackids: [curr.trackid], count: 1 });
                            } else {
                                it[0].count++;
                                it[0].tracknames += ', ' + curr.track;
                                it[0].trackids.push(curr.trackid);
                            }
                            return acc;
                        }, []);
                        users.sort(function (a, b) { return b.count - a.count });
                        users.forEach(function (u, j) { u.rank = j; });
                        var filtered = users.filter(function (u) { return u.count > 1 && u.id != me.id; });
                        var favs = [];
                        filtered.forEach(function (f) {
                            SC.get('/users/' + f.id + '/favorites', function (fs) {
                                fs.forEach(function (fx) { favs.push({ track: fx.title, trackid: fx.id }); });
                                f.processed = true;
                            });
                        });
                        (function accumulateTracksIfReady() {
                            var tr = true;
                            for (var j = 0; j < filtered.length; j++) {
                                if (!filtered[j].processed) {
                                    tr = false;
                                    break;
                                } 
                            }
                            if (tr) {
                                var tracks = favs.reduce(function (acc, curr) {
                                    var it = acc.filter(function (x) { return x.id == curr.trackid; });
                                    if (it.length == 0) {
                                        acc.push({ id: curr.trackid, count: 1, name: curr.track, url: $sce.trustAsResourceUrl('https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + curr.trackid + '&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true') });
                                    } else {
                                        it[0].count++;
                                    }
                                    return acc;
                                }, []);
                                tracks.sort(function(a, b) { return b.count - a.count; });
                                tracks.forEach(function (t, j) { t.rank = j });
                                var fed = tracks.filter(function (trk) {
                                    if (trk.count == 1) return false;
                                    if ($scope.favorites.filter(function (myf) { return myf.id == trk.id }).length > 0) return false;
                                    return true;
                                });
                                $scope.tracks = fed.slice(0,10);
                                $scope.$apply();
                                return;
                            }
                            setTimeout(accumulateTracksIfReady, 300);
                        })();
                        return;
                    }
                    setTimeout(loadTracksIfReady, 300);
                })();
            });
        });
    });
});
