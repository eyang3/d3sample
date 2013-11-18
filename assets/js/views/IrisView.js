/**
 * IrisView
 *
 * IrisView will take care how to present data.
 *
 * @class IrisView
 */

define(['backbone', 'd3', 'figue', 'templates/iris', 'css!styles/trellis.css', 'css!styles/sequences.css'], function(Backbone, d3, figue, Templates) {
    var IrisView = Backbone.View.extend({
        template: Templates.iris,

        render: function() {
            this.$el.html(this.template());

            this._renderTrellis(this.model);

            // Cluster and build hierachy data for radial clustergram.
            var hierachyData = this._buildHierachy(this.model);

            this._renderRadialClustergram(hierachyData);

            return this;
        },

        /**
         * _renderRadialClustergram will render radial clustergram.
         * @method _renderRadialClustergram
         * @param {Object} hierachy The hierachy structure of the data.
         */
        _renderRadialClustergram: function(hierachy) {
            // Dimensions of sunburst.
            var width = 750;
            var height = 600;
            var radius = Math.min(width, height) / 2;

            // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
            var b = {
                w: 75,
                h: 30,
                s: 3,
                t: 10
            };

            // Mapping of step names to colors which are top 3 of d3.scale.category10().
            var colors = {
                'setosa': '#1f77b4',
                'versicolor': '#ff7f0e',
                'virginica': '#2ca02c',

                'species': '#7f7f7f'
            };

            // Total size of all segments; we set this later, after loading the data.
            var totalSize = 0;

            var vis = d3.select('#radial-clustergram #chart').append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('id', 'container')
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

            var partition = d3.layout.partition()
                .size([2 * Math.PI, radius * radius])
                .value(function(d) {
                    return d.size;
                });

            var arc = d3.svg.arc()
                .startAngle(function(d) {
                    return d.x;
                })
                .endAngle(function(d) {
                    return d.x + d.dx;
                })
                .innerRadius(function(d) {
                    return Math.sqrt(d.y);
                })
                .outerRadius(function(d) {
                    return Math.sqrt(d.y + d.dy);
                });

            createVisualization(hierachy);

            // Main function to draw and set up the visualization, once we have the data.

            function createVisualization(hierachy) {

                // Basic setup of page elements.
                initializeBreadcrumbTrail();

                // Bounding circle underneath the sunburst, to make it easier to detect
                // when the mouse leaves the parent g.
                vis.append('circle')
                    .attr('r', radius)
                    .style('opacity', 0);

                // For efficiency, filter nodes to keep only those large enough to see.
                var nodes = partition.nodes(hierachy)
                    .filter(function(d) {
                        return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
                    });

                var path = vis.data([hierachy]).selectAll('path')
                    .data(nodes)
                    .enter().append('path')
                    .attr('display', function(d) {
                        return d.depth ? null : 'none';
                    })
                    .attr('d', arc)
                    .attr('fill-rule', 'evenodd')
                    .style('fill', function(d) {
                        return colors[d.name];
                    })
                    .style('opacity', 1)
                    .on('mouseover', mouseover)
                    .on('click', selectCluster);

                // Add the mouseleave handler to the bounding circle.
                d3.select('#container').on('mouseleave', mouseleave);

                // Get total size of the tree = value of root node from partition.
                totalSize = path.node().__data__.value;
            };

            // Highlight the points in trellis.

            function selectCluster(d){
                // Find all species and store them in an Array. Better way could be calculating the area.
                var species = [];

                collectSpecies(d);

                function collectSpecies(node){
                    if(node.label !== -1){
                        species.push({'petal width': node.centroid[0], 'sepal length': node.centroid[1]});
                    } else {
                        if(node.left) {
                            collectSpecies(node.left);
                        }
                        if(node.right) {
                            collectSpecies(node.right);
                        }
                    }
                }

                d3.selectAll('#trellis circle').classed('hidden', function(d) {
                    var hidden = true;
                    for(var i = 0; i< species.length; i++) {
                        if(species[i]['petal width'] == d['petal width'] && species[i]['sepal length'] == d['sepal length']) {
                            hidden = false;
                        }
                    }
                    return hidden;
                });
            }

            // Fade all but the current sequence, and show it in the breadcrumb trail.

            function mouseover(d) {

                var percentage = (100 * d.value / totalSize).toPrecision(3);
                var percentageString = percentage + '%';
                if (percentage < 0.1) {
                    percentageString = '< 0.1%';
                }

                d3.select('#percentage')
                    .text(percentageString);

                d3.select('#explanation')
                    .style('visibility', '');

                var sequenceArray = getAncestors(d);
                updateBreadcrumbs(sequenceArray, percentageString);

                // Fade all the segments.
                d3.selectAll('path')
                    .style('opacity', 0.3);

                // Then highlight only those that are an ancestor of the current segment.
                vis.selectAll('path')
                    .filter(function(node) {
                        return (sequenceArray.indexOf(node) >= 0);
                    })
                    .style('opacity', 1);
            }

            // Restore everything to full opacity when moving off the visualization.

            function mouseleave(d) {

                // Hide the breadcrumb trail
                d3.select('#trail')
                    .style('visibility', 'hidden');

                // Deactivate all segments during transition.
                d3.selectAll('path').on('mouseover', null);

                // Transition each segment to full opacity and then reactivate it.
                d3.selectAll('path')
                    .transition()
                    .duration(1000)
                    .style('opacity', 1)
                    .each('end', function() {
                        d3.select(this).on('mouseover', mouseover);
                    });

                d3.select('#explanation')
                    .transition()
                    .duration(1000)
                    .style('visibility', 'hidden');
            }

            // Given a node in a partition layout, return an array of all of its ancestor
            // nodes, highest first, but excluding the root.

            function getAncestors(node) {
                var path = [];
                var current = node;
                while (current.parent) {
                    path.unshift(current);
                    current = current.parent;
                }
                return path;
            }

            function initializeBreadcrumbTrail() {
                // Add the svg area.
                var trail = d3.select('#sequence').append('svg')
                    .attr('width', 900)
                    .attr('height', 50)
                    .attr('id', 'trail');
                // Add the label at the end, for the percentage.
                trail.append('text')
                    .attr('id', 'endlabel')
                    .style('fill', '#000');
            }

            // Generate a string that describes the points of a breadcrumb polygon.

            function breadcrumbPoints(d, i) {
                var points = [];
                points.push('0,0');
                points.push(b.w + ',0');
                points.push(b.w + b.t + ',' + (b.h / 2));
                points.push(b.w + ',' + b.h);
                points.push('0,' + b.h);
                if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
                    points.push(b.t + ',' + (b.h / 2));
                }
                return points.join(' ');
            }

            // Update the breadcrumb trail to show the current sequence and percentage.

            function updateBreadcrumbs(nodeArray, percentageString) {

                // Data join; key function combines name and depth (= position in sequence).
                var g = d3.select('#trail')
                    .selectAll('g')
                    .data(nodeArray, function(d) {
                        return d.name + d.depth;
                    });

                // Add breadcrumb and label for entering nodes.
                var entering = g.enter().append('g');

                entering.append('polygon')
                    .attr('points', breadcrumbPoints)
                    .style('fill', function(d) {
                        return colors[d.name];
                    });

                entering.append('text')
                    .attr('x', (b.w + b.t) / 2)
                    .attr('y', b.h / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return d.name;
                    });

                // Set position for entering and updating nodes.
                g.attr('transform', function(d, i) {
                    return 'translate(' + i * (b.w + b.s) + ', 0)';
                });

                // Remove exiting nodes.
                g.exit().remove();

                // Now move and update the percentage at the end.
                d3.select('#trail').select('#endlabel')
                    .attr('x', (nodeArray.length + 0.5) * (b.w + b.s))
                    .attr('y', b.h / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle')
                    .text(percentageString);

                // Make the breadcrumb trail visible, if it's hidden.
                d3.select('#trail')
                    .style('visibility', '');

            }

            return this;
        },

        /**
         * Build hierachy structure of the data. Data will be clustered first and add necessary data fields into it.
         *
         * @method _buildHierachy
         * @param {Array} data The data collection.
         */
        _buildHierachy: function(data) {
            // Just select petal width and sepal length for clustering example.
            var labels = new Array ;
            var vectors = new Array ;
            for (var i = 0 ; i < data.length ; i++) {
                labels[i] = data[i]['species'] ;
                vectors[i] = [ data[i]['petal width'] , data[i]['sepal length']] ;
            }
            var root = figue.agglomerate(labels, vectors , figue.EUCLIDIAN_DISTANCE,figue.SINGLE_LINKAGE);

            // Add children for d3 sunburst
            addFieldsForSunburst(root);

            function addFieldsForSunburst(node){
                if(node.label !== -1) {
                    node.name = node.label;
                } else {
                    node.name = 'species';
                }

                if(node.left && node.right) {
                    node.children = [node.left, node.right];
                    addFieldsForSunburst(node.children[0]);
                    addFieldsForSunburst(node.children[1]);
                }
            }

            return root;
        },

        /**
         * Render Trellis.
         *
         * @method _renderTrellis
         * @param {Array} data The data collection.
         */
        _renderTrellis: function(data) {
            var width = 960,
                size = 150,
                padding = 19.5;

            var x = d3.scale.linear()
                .range([padding / 2, size - padding / 2]);

            var y = d3.scale.linear()
                .range([size - padding / 2, padding / 2]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .ticks(5);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .ticks(5);

            var color = d3.scale.category10();
            var domainByTrait = {},
                traits = d3.keys(data[0]).filter(function(d) {
                    return d !== 'species';
                }),
                n = traits.length;

            traits.forEach(function(trait) {
                domainByTrait[trait] = d3.extent(data, function(d) {
                    return d[trait];
                });
            });

            xAxis.tickSize(size * n);
            yAxis.tickSize(-size * n);

            var brush = d3.svg.brush()
                .x(x)
                .y(y)
                .on('brushstart', brushstart)
                .on('brush', brushmove)
                .on('brushend', brushend);

            var svg = d3.select('#trellis').append('svg')
                .attr('width', size * n + padding)
                .attr('height', size * n + padding)
                .append('g')
                .attr('transform', 'translate(' + padding + ',' + padding / 2 + ')');

            svg.selectAll('.x.axis')
                .data(traits)
                .enter().append('g')
                .attr('class', 'x axis')
                .attr('transform', function(d, i) {
                    return 'translate(' + (n - i - 1) * size + ',0)';
                })
                .each(function(d) {
                    x.domain(domainByTrait[d]);
                    d3.select(this).call(xAxis);
                });

            svg.selectAll('.y.axis')
                .data(traits)
                .enter().append('g')
                .attr('class', 'y axis')
                .attr('transform', function(d, i) {
                    return 'translate(0,' + i * size + ')';
                })
                .each(function(d) {
                    y.domain(domainByTrait[d]);
                    d3.select(this).call(yAxis);
                });

            var cell = svg.selectAll('.cell')
                .data(cross(traits, traits))
                .enter().append('g')
                .attr('class', 'cell')
                .attr('transform', function(d) {
                    return 'translate(' + (n - d.i - 1) * size + ',' + d.j * size + ')';
                })
                .each(plot);

            // Titles for the diagonal.
            cell.filter(function(d) {
                return d.i === d.j;
            }).append('text')
                .attr('x', padding)
                .attr('y', padding)
                .attr('dy', '.71em')
                .text(function(d) {
                    return d.x;
                });

            cell.call(brush);

            function plot(p) {
                var cell = d3.select(this);

                x.domain(domainByTrait[p.x]);
                y.domain(domainByTrait[p.y]);

                cell.append('rect')
                    .attr('class', 'frame')
                    .attr('x', padding / 2)
                    .attr('y', padding / 2)
                    .attr('width', size - padding)
                    .attr('height', size - padding);

                cell.selectAll('circle')
                    .data(data)
                    .enter().append('circle')
                    .attr('cx', function(d) {
                        return x(d[p.x]);
                    })
                    .attr('cy', function(d) {
                        return y(d[p.y]);
                    })
                    .attr('r', 3)
                    .style('fill', function(d) {
                        return color(d.species);
                    });
            }

            var brushCell;

            // Clear the previously-active brush, if any.

            function brushstart(p) {
                if (brushCell !== this) {
                    d3.select(brushCell).call(brush.clear());
                    x.domain(domainByTrait[p.x]);
                    y.domain(domainByTrait[p.y]);
                    brushCell = this;
                }
            }

            // Highlight the selected circles.

            function brushmove(p) {
                var e = brush.extent();
                svg.selectAll('circle').classed('hidden', function(d) {
                    return e[0][0] > d[p.x] || d[p.x] > e[1][0] || e[0][1] > d[p.y] || d[p.y] > e[1][1];
                });
            }

            // If the brush is empty, select all circles.

            function brushend() {
                if (brush.empty()) svg.selectAll('.hidden').classed('hidden', false);
            }

            function cross(a, b) {
                var c = [],
                    n = a.length,
                    m = b.length,
                    i, j;
                for (i = -1; ++i < n;)
                    for (j = -1; ++j < m;) c.push({
                        x: a[i],
                        i: i,
                        y: b[j],
                        j: j
                    });
                return c;
            }

            d3.select(window.frameElement).style('height', size * n + padding + 20 + 'px');
            return this;
        }
    });
    return IrisView;
});
