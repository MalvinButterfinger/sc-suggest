(function (root) {
    root.qsc = factory();
    function factory() {
        var trackFavoriters = [];
        var userFavorites = [];
        var userFollowers = [];
        var userFollowings = [];

        var qsc = {
            get: get,
            getMyData: getMyData,
            getFavorites: getFavorites,
            getFavoriters: getFavoriters,
            getFollowings: getFollowings,
            getFavoritesForTrackFavoriters: getFavoritesForTrackFavoriters,
            getFavoriterFavoritesForUserFavorites: getFavoriterFavoritesForUserFavorites,
            getFavoritesForUserFollowers: getFavoritesForUserFollowers,
            getFavoritesForUserFollowings: getFavoritesForUserFollowings,
            connect: connect
        };
        return qsc;

        function getMyData() {
            var deferred = Q.defer();
            getFavorites('/me').then(function (favorites) {
                getFollowings('/me').then(function (followings) {
                    deferred.resolve({ favorites: favorites, followings: followings });
                });
            });
            return deferred.promise;
        }

        function getFavoritesForUserFollowers(userUrl) {
            var deferred = Q.defer();
            getFollowers(userUrl).then(getFavoritesForUsers).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        }

        function getFavoritesForUserFollowings(userUrl) {
            var deferred = Q.defer();
            getFollowings(userUrl).then(getFavoritesForUsers).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        }

        function getFavoriterFavoritesForUserFavorites(userUrl) {
            var deferred = Q.defer();
            getFavorites(userUrl).then(getFavoritesForTracksFavoriters).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        }

        function getFavoritesForTrackFavoriters(trackUrl) {
            var deferred = Q.defer();
            getFavoriters(trackUrl).then(getFavoritesForUsers).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        }

        function getFavoritesForUsers(users) {
            return groupItemsForItems(users, function(u) { return getFavorites('/users/' + u.id); });
        }

        function getFollowingsForUsers(users) {
            return groupItemsForItems(users, function(u) { return getFollowings('/users/' + u.id); });
        }

        function getFollowersForUsers(users) {
            return groupItemsForItems(users, function(u) { return getFollowers('/users/' + u.id); });
        }

        function getFavoritersForTracks(tracks) {
            return groupItemsForItems(tracks, function(t) { return getFavoriters('/tracks/' + t.id); });
        }

        function getFavoritesForTracksFavoriters(tracks) {
            return groupItemsForItems(tracks, function (t) { return getFavoriters('/tracks/' + t.id); }).then(getFavoritesForUsers);
        }


        function groupItemsForItems(items, getItems) {
            var deferred = Q.defer();
            Q.all(items.filter(function(x){return (!x.count) || (x.count > 1);}).map(getItems)).then(function (its) {
                var grouped = [];
                for (var i = 0; i < its.length; i++) {
                    var itg = its[i];
                    for (var j = 0; j < itg.length; j++) {
                        var tr = itg[j];
                        var it = grouped.filter(function (i) { return i.item.id == tr.id; });
                        if (it.length == 0) {
                            grouped.push({ id: tr.id, item: tr, count: 1 });
                        }
                        else {
                            it[0].count++;
                        }
                    }
                }
                deferred.resolve(grouped);
            }, deferred.reject);
            return deferred.promise;
        }

        function getFavorites(userUrl) {
            if (userFavorites[userUrl]) {
                return Q.fcall(function () { return userFavorites[userUrl]; });
            } else {
                return get(userUrl + '/favorites').then(cacheUserFavorites(userUrl));
            }
        }

        function getFavoriters(trackUrl) {
            if (trackFavoriters[trackUrl]) {
                return Q.fcall(function() { return trackFavoriters[trackUrl]; });
            } else return get(trackUrl + '/favoriters').then(cacheTrackFavoriters(trackUrl));
        }

        function getFollowers(userUrl) {
            if (userFollowers[userUrl]) {
                return Q.fcall(function () { return userFollowers[userUrl]; });
            } else get(userUrl + '/followers').then(cacheUserFollowers(userUrl));
        }

        function getFollowings(userUrl) {
            return get(userUrl + '/followings');
        }

        function cacheUserFollowers(url) {
            return function (users) {
                userFollowers[url] = users;
                return Q.fcall(function () { return users;})
            }
        }

        function cacheTrackFavoriters(url) {
            return function (favoriters) {
                trackFavoriters[url] = favoriters;
                return Q.fcall(function()  {return favoriters; });
            }
        }

        function cacheUserFavorites(url) {
            return function (favorites) {
                userFavorites[url] = favorites;
                return Q.fcall(function () { return favorites; });
            }
        }

        function connect() {
            var deferred = Q.defer();
            SC.connect(function () {
                deferred.resolve();
            });
            rejectAfter(5000, 500, deferred, connect);
            return deferred.promise;
        }

        function get(url, i) {
            i = i || 0;
            var deferred = Q.defer();
            resolveOrRetry(url);
            //rejectAfter(10000, 500, deferred, url);
            return deferred.promise;

            function resolveOrRetry(url) {
                SC.get(url, { limit: 100, linked_partitioning: 1 },function (data, error) {
                    if (error) {
                        resolveOrRetry(url);
                        return;
                    }
                    if (data.collection) {
                        var results = data.collection;
                        //if (data.next_href && i < 1) {
                        //    get(data.next_href, i++).then(results.concat).then(function (results) {
                        //        deferred.resolve(results);
                        //    });
                        //    return;
                        //} 
                        deferred.resolve(data.collection);
                    }
                    else deferred.resolve(data);
                });
            }
        }

        function rejectAfter(timeout, step, deferred, msg) {
            var t = 0;
            (function waitOrReject() {
                if (t > timeout / step) {
                    deferred.reject('Timeout: ' + msg)
                    return;
                };
                t++;
                setTimeout(waitOrReject, step);
            })();
        }
    }
})(window);