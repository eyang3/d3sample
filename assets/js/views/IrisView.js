/**
 * IrisView
 *
 * @return {object}
 */

define(['backbone', 'd3', 'templates/iris', 'css!styles/trellis.css', 'css!styles/sequences.css'], function(Backbone, d3, Templates) {
    var IrisView = Backbone.View.extend({
        template: Templates.iris,
        render: function() {
            this.$el.html(this.template());

            this.renderTrellis(this.model);
            this.renderRadialClustergram();
            return this;
        },

        renderRadialClustergram: function(data) {
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

            // Mapping of step names to colors.
            var colors = {
                'home': '#5687d1',
                'product': '#7b615c',
                'search': '#de783b',
                'account': '#6ab975',
                'other': '#a173d1',
                'end': '#bbbbbb'
            };

            // Total size of all segments; we set this later, after loading the data.
            var totalSize = 0;

            var vis = d3.select('#radial-clustergram #chart').append('svg:svg')
                .attr('width', width)
                .attr('height', height)
                .append('svg:g')
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

            // Use d3.text and d3.csv.parseRows so that we do not need to have a header
            // row, and can receive the csv as an array of arrays.
            //var json = buildHierarchy(csv);
            var json = {
                "name": "flare",
                "children": [{
                    "name": "analytics",
                    "size": 7000,
                    "children": [{
                        "name": "cluster",
                        "size": 6800,
                        "children": [{
                            "name": "AgglomerativeCluster",
                            "size": 3938
                        }, {
                            "name": "CommunityStructure",
                            "size": 3812
                        }, {
                            "name": "HierarchicalCluster",
                            "size": 6714
                        }, {
                            "name": "MergeEdge",
                            "size": 743
                        }]
                    }, {
                        "name": "cluster2",
                        "size": 3000
                    }]
                }, {
                    "name": "analytics2",
                    "size": 2000
                }]
            };
            createVisualization(json);

            // Main function to draw and set up the visualization, once we have the data.

            function createVisualization(json) {

                // Basic setup of page elements.
                initializeBreadcrumbTrail();
                drawLegend();
                d3.select('#togglelegend').on('click', toggleLegend);

                // Bounding circle underneath the sunburst, to make it easier to detect
                // when the mouse leaves the parent g.
                vis.append('svg:circle')
                    .attr('r', radius)
                    .style('opacity', 0);

                // For efficiency, filter nodes to keep only those large enough to see.
                var nodes = partition.nodes(json)
                    .filter(function(d) {
                        return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
                    });

                var path = vis.data([json]).selectAll('path')
                    .data(nodes)
                    .enter().append('svg:path')
                    .attr('display', function(d) {
                        return d.depth ? null : 'none';
                    })
                    .attr('d', arc)
                    .attr('fill-rule', 'evenodd')
                    .style('fill', function(d) {
                        return colors[d.name];
                    })
                    .style('opacity', 1)
                    .on('mouseover', mouseover);

                // Add the mouseleave handler to the bounding circle.
                d3.select('#container').on('mouseleave', mouseleave);

                // Get total size of the tree = value of root node from partition.
                totalSize = path.node().__data__.value;
            };

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
                var trail = d3.select('#sequence').append('svg:svg')
                    .attr('width', width)
                    .attr('height', 50)
                    .attr('id', 'trail');
                // Add the label at the end, for the percentage.
                trail.append('svg:text')
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
                var entering = g.enter().append('svg:g');

                entering.append('svg:polygon')
                    .attr('points', breadcrumbPoints)
                    .style('fill', function(d) {
                        return colors[d.name];
                    });

                entering.append('svg:text')
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

            function drawLegend() {

                // Dimensions of legend item: width, height, spacing, radius of rounded rect.
                var li = {
                    w: 75,
                    h: 30,
                    s: 3,
                    r: 3
                };

                var legend = d3.select('#legend').append('svg:svg')
                    .attr('width', li.w)
                    .attr('height', d3.keys(colors).length * (li.h + li.s));

                var g = legend.selectAll('g')
                    .data(d3.entries(colors))
                    .enter().append('svg:g')
                    .attr('transform', function(d, i) {
                        return 'translate(0,' + i * (li.h + li.s) + ')';
                    });

                g.append('svg:rect')
                    .attr('rx', li.r)
                    .attr('ry', li.r)
                    .attr('width', li.w)
                    .attr('height', li.h)
                    .style('fill', function(d) {
                        return d.value;
                    });

                g.append('svg:text')
                    .attr('x', li.w / 2)
                    .attr('y', li.h / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return d.key;
                    });
            }

            function toggleLegend() {
                var legend = d3.select('#legend');
                if (legend.style('visibility') == 'hidden') {
                    legend.style('visibility', '');
                } else {
                    legend.style('visibility', 'hidden');
                }
            }

            // Take a 2-column CSV and transform it into a hierarchical structure suitable
            // for a partition layout. The first column is a sequence of step names, from
            // root to leaf, separated by hyphens. The second column is a count of how
            // often that sequence occurred.

            function buildHierarchy(csv) {
                var root = {
                    'name': 'root',
                    'children': []
                };
                for (var i = 0; i < csv.length; i++) {
                    var sequence = csv[i][0];
                    var size = +csv[i][1];
                    if (isNaN(size)) { // e.g. if this is a header row
                        continue;
                    }
                    var parts = sequence.split('-');
                    var currentNode = root;
                    for (var j = 0; j < parts.length; j++) {
                        var children = currentNode['children'];
                        var nodeName = parts[j];
                        var childNode;
                        if (j + 1 < parts.length) {
                            // Not yet at the end of the sequence; move down the tree.
                            var foundChild = false;
                            for (var k = 0; k < children.length; k++) {
                                if (children[k]['name'] == nodeName) {
                                    childNode = children[k];
                                    foundChild = true;
                                    break;
                                }
                            }
                            // If we don't already have a child node for this branch, create it.
                            if (!foundChild) {
                                childNode = {
                                    'name': nodeName,
                                    'children': []
                                };
                                children.push(childNode);
                            }
                            currentNode = childNode;
                        } else {
                            // Reached the end of the sequence; create a leaf node.
                            childNode = {
                                'name': nodeName,
                                'size': size
                            };
                            children.push(childNode);
                        }
                    }
                }
                return root;
            };
            return this;
        },

        renderTrellis: function(data) {
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
