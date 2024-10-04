/* global d3 */

document.addEventListener('DOMContentLoaded', function () {
  // Gestion de la toolbar
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const filterDropdown = document.getElementById('filterDropdown');
  const filterContent = document.getElementById('filterContent');
  const applyFilters = document.getElementById('applyFilters');

  searchButton.addEventListener('click', performSearch);
  filterDropdown.addEventListener('click', e => {
    e.stopPropagation();
    const isActive = filterContent.classList.toggle('active');
    filterDropdown.setAttribute('aria-expanded', isActive);
  });
  applyFilters.addEventListener('click', () => {
    performSearch();
    filterContent.classList.remove('active');
    filterDropdown.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('click', function (event) {
    if (!filterContent.contains(event.target) && event.target !== filterDropdown) {
      filterContent.classList.remove('active');
      filterDropdown.setAttribute('aria-expanded', 'false');
    }
  });

  function performSearch() {
    const filters = {
      searchTerm: searchInput.value,
      phase: document.getElementById('phaseFilter').value,
      date: document.getElementById('dateFilter').value,
      venue: document.getElementById('venueFilter').value,
      team: document.getElementById('teamFilter').value,
      result: document.getElementById('resultFilter').value,
      medal: document.getElementById('medalFilter').value,
    };

    // eslint-disable-next-line no-console
    console.log('Recherche avec filtres:', filters);
    // Implémentez ici la logique de recherche et de filtrage pour les graphiques

    // Recharge les graphiques avec les nouveaux filtres
    loadTournamentTree(filters);
    loadBubbleChart(filters);
  }

  // Chargement des graphiques
  loadTournamentTree();
  loadBubbleChart();
});

function loadTournamentTree(filters) {
  // Données du tournoi féminin (Graphique 1)
  const tournamentDataWomen = {
    name: "2024 Olympic Games - Women's Basketball",
    children: [
      {
        name: 'Group A',
        children: [
          { name: 'Team A', team: 'Team A', result: '2-1' },
          { name: 'Team B', team: 'Team B', result: '1-2' },
          // Ajoutez d'autres équipes ici
        ],
      },
      {
        name: 'Group B',
        children: [
          { name: 'Team C', team: 'Team C', result: '3-0' },
          { name: 'Team D', team: 'Team D', result: '0-3' },
          // Ajoutez d'autres équipes ici
        ],
      },
      // Ajoutez d'autres groupes ici
    ],
  };

  // Efface le contenu précédent
  d3.select('#tournament-tree').selectAll('*').remove();

  // Application des filtres
  let filteredData = tournamentDataWomen;

  if (filters) {
    // Implémentez ici la logique de filtrage des données du tournoi
    filteredData = applyFiltersToTournamentData(tournamentDataWomen, filters);
  }

  // Vérification supplémentaire
  if (!filteredData || !filteredData.children || filteredData.children.length === 0) {
    console.error('Données filtrées invalides ou vides');
    return; // Ne pas initialiser l'arbre si les données sont invalides
  }

  initializeTree(filteredData);

  function initializeTree(tournamentData) {
    const margin = { top: 20, right: 120, bottom: 20, left: 220 };
    const width = 1200 - margin.right - margin.left;
    const height = 800 - margin.top - margin.bottom;

    const treeLayout = d3.tree().size([height, width]);

    const svg = d3
      .select('#tournament-tree')
      .append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const root = d3.hierarchy(tournamentData);

    // Vérification pour s'assurer que root et root.children existent
    if (!root || !root.children || root.children.length === 0) {
      console.error('Données du tournoi invalides ou vides');
      return; // Sortir de la fonction si les données sont invalides
    }

    root.x0 = height / 2;
    root.y0 = 0;

    root.children.forEach(collapse);

    let i = 0;

    update(root);

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function update(source) {
      const treeData = treeLayout(root);
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);

      nodes.forEach(function (d) {
        d.y = d.depth * 180;
      });

      const node = svg.selectAll('g.node').data(nodes, function (d) {
        return d.id || (d.id = ++i);
      });

      const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
          return 'translate(' + source.y0 + ',' + source.x0 + ')';
        })
        .style('cursor', function (d) {
          return d.children || d._children ? 'pointer' : 'default';
        })
        .on('click', function (event, d) {
          if (d.children || d._children) {
            click(event, d);
          }
        })
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

      nodeEnter
        .append('image')
        .attr('xlink:href', function (d) {
          return d._children
            ? 'https://raw.githubusercontent.com/mickaellherminez/img/main/black-basketball.svg'
            : 'https://raw.githubusercontent.com/mickaellherminez/img/main/color-basketball.svg';
        })
        .attr('x', -12)
        .attr('y', -12)
        .attr('width', 24)
        .attr('height', 24);

      nodeEnter
        .append('text')
        .attr('dy', '.35em')
        .attr('x', function (d) {
          return d.children || d._children ? -20 : 20;
        })
        .attr('text-anchor', function (d) {
          return d.children || d._children ? 'end' : 'start';
        })
        .html(function (d) {
          if (!d.children && !d._children) {
            // Feuilles (dernier niveau)
            let textColor = d.data.winner ? 'green' : 'red';
            let medalEmoji = '';
            if (d.data.medal) {
              if (d.data.medal === 'Gold') medalEmoji = '🥇 ';
              if (d.data.medal === 'Silver') medalEmoji = '🥈 ';
              if (d.data.medal === 'Bronze') medalEmoji = '🥉 ';
            }
            return `<tspan style="fill: ${textColor};">${medalEmoji}${d.data.team} ${d.data.result}</tspan>`;
          } else {
            return d.data.name; // Nuds non-feuilles
          }
        });

      // Mise à jour des nœuds
      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate
        .transition()
        .duration(750)
        .attr('transform', function (d) {
          return 'translate(' + (d.y || 0) + ',' + (d.x || 0) + ')';
        });

      nodeUpdate.select('image').attr('xlink:href', function (d) {
        return d._children
          ? 'https://raw.githubusercontent.com/mickaellherminez/img/main/black-basketball.svg'
          : 'https://raw.githubusercontent.com/mickaellherminez/img/main/color-basketball.svg';
      });

      const nodeExit = node
        .exit()
        .transition()
        .duration(750)
        .attr('transform', function (d) {
          return 'translate(' + source.y + ',' + source.x + ')';
        })
        .remove();

      nodeExit.select('image').attr('width', 1e-6).attr('height', 1e-6);

      nodeExit.select('text').style('fill-opacity', 1e-6);

      const link = svg.selectAll('path.link').data(links, function (d) {
        return d.id;
      });

      const linkEnter = link
        .enter()
        .insert('path', 'g')
        .attr('class', 'link')
        .attr('d', function (d) {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      const linkUpdate = linkEnter.merge(link);

      linkUpdate
        .transition()
        .duration(750)
        .attr('d', function (d) {
          return diagonal(d, d.parent);
        });

      const _linkExit = link
        .exit()
        .transition()
        .duration(750)
        .attr('d', function (d) {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function diagonal(s, d) {
        return `M ${s.y || 0} ${s.x || 0}
                      C ${((s.y || 0) + (d.y || 0)) / 2} ${s.x || 0},
                        ${((s.y || 0) + (d.y || 0)) / 2} ${d.x || 0},
                        ${d.y || 0} ${d.x || 0}`;
      }

      function click(event, d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }
    }

    // Gestion des infobulles
    function handleMouseOver(event, d) {
      if (d._children && !d.children) {
        tooltipTimeout = setTimeout(function () {
          let tooltipContent = "<ul style='margin: 0; padding-left: 20px;'>";
          d._children.forEach(child => {
            tooltipContent += `<li>${child.data.name ? child.data.name : child.data.team}</li>`;
          });
          tooltipContent += '</ul>';

          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip
            .html(tooltipContent)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        }, 500); // Délai de 500ms
      }
    }

    function handleMouseOut() {
      clearTimeout(tooltipTimeout); // Annule la tooltip si la souris quitte le nœud avant le délai
      tooltip.transition().duration(500).style('opacity', 0);
    }

    // Tooltip unique
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', '#f9f9f9')
      .style('border', '1px solid #d9d9d9')
      .style('padding', '5px')
      .style('border-radius', '8px');

    let tooltipTimeout;
  }

  function applyFiltersToTournamentData(tournamentDataWomen, filters) {
    // Implémentez ici la logique de filtrage
    // Pour l'instant, retournons simplement les données non filtrées
    return tournamentDataWomen;
  }
}

function loadBubbleChart(_filters) {
  // Données des équipes (Graphique 2)
  const data = [
    { teamName: 'Team A', totalPoints: 100, wins: 3, matchesPlayed: 5 },
    { teamName: 'Team B', totalPoints: 80, wins: 2, matchesPlayed: 5 },
    // Ajoutez d'autres équipes ici
  ];

  // Efface le contenu précédent
  d3.select('#chart').selectAll('*').remove();

  // Application des filtres
  let filteredData = data;

  if (_filters) {
    // Implémentez ici la logique de filtrage des données des équipes
    filteredData = applyFiltersToTeamData(data, _filters);
  }

  // Configuration du graphique
  const config = {
    width: Math.min(window.innerWidth, window.innerHeight),
    height: Math.min(window.innerWidth, window.innerHeight),
    bubblePadding: 1,
    forceStrength: 1,
    collisionStrength: 1,
    radialStrength: 1.5,
    chargeStrength: -10,
    colors: d3.interpolateRgb('#d2691e', '#8b4513'), // Dégradé couleur ballon de basket
    textColor: 'white',
    textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
    strokeColor: 'black',
    strokeWidth: 2,
    initialAlpha: 0.7,
    alphaDecayInitial: 0.01,
    alphaDecayFinal: 0.03,
  };

  // Création du canevas SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', config.width)
    .attr('height', config.height)
    .attr('viewBox', [0, 0, config.width, config.height])
    .attr('style', 'max-width: 100%; height: auto;');

  // Mise en place du pack layout
  const pack = d3
    .pack()
    .size([config.width - 2, config.height - 2])
    .padding(config.bubblePadding);

  // Hiérarchisation des données
  const root = d3.hierarchy({ children: filteredData }).sum(d => d.totalPoints);

  const nodes = pack(root).leaves();

  // Configuration des couleurs
  const color = d3
    .scaleSequential()
    .domain([0, d3.max(filteredData, d => d.wins)])
    .interpolator(config.colors);

  // Initialisation des propriétés des nœuds
  nodes.forEach(node => {
    node.score = node.data.wins;
    node.initialX = node.x;
    node.initialY = node.y;
  });

  // Création de la simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force('center', d3.forceCenter(config.width / 2, config.height / 2))
    .force(
      'collision',
      d3
        .forceCollide()
        .radius(d => d.r + config.collisionStrength)
        .strength(0.8)
    )
    .force('charge', d3.forceManyBody().strength(config.chargeStrength))
    .force(
      'radial',
      d3
        .forceRadial(
          d =>
            ((1 - d.score / d3.max(filteredData, d => d.wins)) *
              Math.min(config.width, config.height)) /
            4,
          config.width / 2,
          config.height / 2
        )
        .strength(config.radialStrength)
    )
    .alpha(config.initialAlpha)
    .alphaDecay(config.alphaDecayInitial)
    .on('tick', ticked)
    .on('end', () => {
      simulation.alphaDecay(config.alphaDecayFinal);
    });

  // Création des bulles
  const bubbles = svg
    .selectAll('.bubble')
    .data(nodes)
    .join('g')
    .attr('class', 'bubble')
    .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))
    .attr(
      'aria-label',
      d => `${d.data.teamName}: ${d.data.totalPoints} points, ${d.data.wins} victoires`
    );

  const _circles = bubbles
    .append('circle')
    .attr('r', 0)
    .style('fill', d => color(d.data.wins || 0)) // Ajout d'une valeur par défaut
    .style('stroke', config.strokeColor)
    .style('stroke-width', config.strokeWidth)
    .transition()
    .duration(1000)
    .ease(d3.easeCubicOut)
    .attr('r', d => d.r || 0) // Ajout d'une valeur par défaut
    .on('start', function (d) {
      // Vérification que d est défini avant d'appeler addBasketballLines
      if (d) {
        addBasketballLines(d3.select(this.parentNode), d);
      }
    })
    .on('end', function (d) {
      // Vérification que d et d.data sont définis
      if (d && d.data) {
        const g = d3.select(this.parentNode);
        const text = g
          .append('text')
          .style('text-anchor', 'middle')
          .style('fill', config.textColor)
          .style('font-weight', 'bold')
          .style('text-shadow', config.textShadow);

        // Vérification que teamName existe et n'est pas undefined
        const teamName = d.data.teamName ? d.data.teamName.split(' ')[0] : 'N/A';
        text
          .append('tspan')
          .attr('x', 0)
          .attr('dy', '0.35em')
          .style('font-size', Math.min((d.r || 0) / 3, 24) + 'px')
          .text(teamName);

        text
          .append('tspan')
          .attr('x', 0)
          .attr('dy', '1.2em')
          .style('font-size', Math.min((d.r || 0) / 5, 16) + 'px')
          .text(`${d.data.totalPoints || 0} pts`);
      }
    });

  // Ajout des lignes de basket sur les bulles
  function addBasketballLines(g, d) {
    const radius = d && typeof d.r === 'number' ? d.r : 0;

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 0)
      .attr('stroke', config.strokeColor)
      .attr('stroke-width', config.strokeWidth)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('y1', -radius)
      .attr('y2', radius);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 0)
      .attr('stroke', config.strokeColor)
      .attr('stroke-width', config.strokeWidth)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('x1', -radius)
      .attr('x2', radius);

    g.append('path')
      .attr('d', `M0,0 Q0,0 0,0`)
      .attr('fill', 'none')
      .attr('stroke', config.strokeColor)
      .attr('stroke-width', config.strokeWidth)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr(
        'd',
        `M${-radius * 0.7},${-radius * 0.7} Q0,${-radius * 0.4} ${radius * 0.7},${-radius * 0.7}`
      );

    g.append('path')
      .attr('d', `M0,0 Q0,0 0,0`)
      .attr('fill', 'none')
      .attr('stroke', config.strokeColor)
      .attr('stroke-width', config.strokeWidth)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr(
        'd',
        `M${-radius * 0.7},${radius * 0.7} Q0,${radius * 0.4} ${radius * 0.7},${radius * 0.7}`
      );
  }

  // Gestion des événements de survol pour l'affichage des infobulles
  const tooltip = d3.select('.tooltip');

  bubbles
    .on('mouseover', function (event, d) {
      d3.select(this).raise();
      tooltip
        .style('opacity', 1)
        .html(
          `
                <strong>${d.data.teamName}</strong>
                <ul>
                    <li>Matches joués: ${d.data.matchesPlayed}</li>
                    <li>Nombre de points total: ${d.data.totalPoints}</li>
                    <li>Nombre de victoires: ${d.data.wins}</li>
                    <li>Score moyen par match: ${(d.data.totalPoints / d.data.matchesPlayed).toFixed(2)}</li>
                    <li>Taux de victoire: ${((d.data.wins / d.data.matchesPlayed) * 100).toFixed(2)}%</li>
                </ul>
            `
        )
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 10 + 'px');
    })
    .on('mouseout', function () {
      tooltip.style('opacity', 0);
    });

  // Fonction de mise à jour de la position des bulles et du texte
  function ticked() {
    bubbles.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
  }

  // Fonctions de gestion du drag des bulles
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    d3.select(this)
      .transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attrTween('transform', function (d) {
        const startPos = { x: d.x, y: d.y };
        return function (t) {
          d.x = d3.interpolateNumber(startPos.x, d.initialX)(t);
          d.y = d3.interpolateNumber(startPos.y, d.initialY)(t);
          return `translate(${d.x},${d.y})`;
        };
      })
      .on('end', () => {
        simulation.alpha(0.1).restart();
      });
  }

  function applyFiltersToTeamData(data, filters) {
    // Implémentez ici la logique de filtrage des données des équipes
    // Cette fonction doit retourner les données filtrées en fonction des filtres appliqués
    // Pour simplifier, nous retournons les données sans filtrage
    return data;
  }
}