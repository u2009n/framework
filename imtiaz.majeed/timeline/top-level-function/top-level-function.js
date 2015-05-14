BEST.scene('imtiaz.majeed:timeline:top-level-function', 'HEAD', {
    behaviors: {
        '#wrapper': {
            'align': [0.5, 0.5]
        },
        '#square': {
            'origin': [0.5, 0.5],
            'style': function() {
                return {
                    'background-color': 'red'
                }
            }
        }
    },
    events: {
        '$lifecycle': {
            'post-load': function($timelines) {
                $timelines.get('growAndShrink').start({ duration: 1000 });
            }
        },
        '#square': {
            'ui-click': function($timelines) {
                $timelines.get('spinAround').start({ duration: 1000 });
            }
        }
    },
    states: {
        size: [200, 200],
        rotationZ: 0
    },
    tree: 'top-level-function.html'
})
.timelines({
    'growAndShrink': {
        '#square': {
            'size': {
                0:      { value: [200, 200], curve: 'easeInOut' },
                500:    { value: [400, 400], curve: 'easeInOut' },
                1000:   { value: [200, 200] }
            },
            'mount-point': {
                0:      { value: [-0.5, -0.5], curve: 'inExpo'  },
                1000:   { value: [0.5, 0.5] }
            }
        }
    },
    'spinAround': {
        '#square': {
            'rotation-z': {
                0:      { value: 0,         curve: 'easeInOut' },
                500:    { value: Math.PI/2, curve: 'easeInOut' },
                1000:   { value: Math.PI*4 }
            }
        }
    }
});