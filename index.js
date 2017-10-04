
/*
M. Bostock https://bl.ocks.org/mbostock & https://github.com/mbostock
Based on: M. Bostock https://bl.ocks.org/mbostock/3885705
License: Released under the GNU General Public License, version 3.

Ik maak eerst alle variabelen aan om te beginnen.

svg => selecteert het svg element.
maak alle margins aan in een object. Zodat het consistent blijft en dynamisch.
bereken de width en de height met de margin variabelen.

*/
var svg = d3.select('svg'),
    margin = {
      top: 20,
      right: 20,
      bottom: 100,
      left: 40
    },
    width = +svg.attr('width') - margin.left - margin.right,
    height = +svg.attr('height') - margin.top - margin.bottom;

// Hier roep ik wat elementen aan voor wat styling. Zodat ik een knop kan gebruiken waarbij je op kan klikken en het verandert de stijl
var title = document.getElementById('title'),
    body = document.getElementsByTagName('body')[0],
    doc = document.getElementById('cmd--style'),
    label = document.getElementById('sort')
    ;

// hier wordt de variabelen x en y aangemaakt. Dit 'tekent' straks de lijnen voor de x en y as
var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
    y = d3.scaleLinear().rangeRound([height, 0]);

// hier is een variabelen genaamd 'g' die de g tag in de svg plaatst met de attribuut transform.
var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// hier wordt de tsv bestand ingeladen en wordt de data eruit getrokken.
d3.tsv('data.tsv', function(d) {
  d.speakers = +d.speakers;
  return d;
}, function(error, data) {
  if (error) throw error;

// door de data kunnen we nu de min en de max bepalen en de axis alvast van data voorzien
// hierbij tekenen we de x en y as.
  x.domain(data.map(function(d) {
    return d.language;
  }));
  y.domain([0, d3.max(data, function(d) {
    return d.speakers;
  })]);

// we geven de g een class een transform mee en verbinden het aan de x as die zich 'beneden'(bottom) plaatsvindt.
  g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end').attr('transform', 'rotate(-45)');

/*
  Nu doen we hetzelfde met de y as. hierbij geven we ook een class mee ook een tick zodat je meer waardes hebt aan de linker kant.
  Dan de tickFormat: We hebben data die in de miljoenen zit en het is vrij lastig te lezen met al die nullen. dus door de tickFormat kunnen we de data formatteren en met formatPrefix het leesbaarder maken.
  1e7 is een code die eigenlijk zegt (1*10 ^ 6). Wat we hiermee doen is eigenlijk 6 nullen weghalen (ofterwel aangeven dat het een miljoen aantal is).
*/
  g.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y)
      .ticks(15).tickFormat(d3.formatPrefix('.0', 1e6)))
    .append('text')
      .attr('transform', 'rotate(40)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('text-anchor', 'end')
      .text('speakers');

/*
  Nu gaan we de bars tekenen. we gebruiken de data en daarna plakken we de rect tag in onze g zonder class.
  we geven ze allemaal een class mee genaamd bar. vullen de bars met een raar roze kleur (waarom ook niet).
  we vullen de x met de waarde languages in onze data (zo weet de bar waar hij moet staan) en de y met de waarde speakers (zo weet de bar hoe hoog hij moet zijn).

  we geven een width en een height mee.
  .bandwidth weergeeft de breedte van elke bar.
  en de height gebruiken we de de data en onze height variabelen om de grootte te bepalen. (indien je de waarde verandert omhoog gaat hij voorbij de x as en omlaag krimpt je bar in).
*/
  g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
      .attr('class', 'bar')
      .attr('fill', '#f0518f')
      .attr('x', function(d) {
        return x(d.language);
      })
      .attr('y', function(d) {
        return y(d.speakers);
      })
      .attr('width', x.bandwidth())
      .attr('height', function(d) {
        return height - y(d.speakers);
      });

/*
  Omdat we wat kleur willen toevoegen en dat zo leuk mogelijk willen doen. Heb ik de variabelen gebruikt om in mijn javascript het te kunnen stijlen (nogmaals why not).

  doc variabelen op het moment dat je die aanklikt start je een functie met een event parameter. op het moment van klikken verandert het volgende van kleur:
  -   body achtergrond kleur verandert van zwart naar CMD geel.
  -   Title verandert naar zwart geldt hetzelfde voor de label.
  -   ik kies de svg selecteer alle bars maak een atribuut aan genaamd fill en geef de waarde zwart mee.
  -   ik selecteer de groep met de class 'axis axis--y' en geeft daar een stroke met de waarde black mee.

  het is een one click only ding, maar waarom zou je het terug willen veranderen. ¯\_(ツ)_/¯
*/
      doc.onclick = function (event) {
            body.style.backgroundColor = '#feca2f';
            title.style.color = 'black';
            label.style.color = 'black';
            svg.selectAll('.bar')
              .attr('fill','black');
            svg.select('g')
              .attr('class', 'axis axis--y')
              .attr('stroke','black');
          }

// d3.select selecteert de input tag in het document en verandert die met de functie change
        d3.select('input').on('change', change);

// hier maken we een time out met een functie die de checkbox 'vrijwel' direct op unchecked zet.
        var sortTimeout = setTimeout(function() {
          d3.select('input').property('unchecked', true).each(change);
        }, 100);

// Hier is de functie change hier gebeurt al het magie.
        function change() {
          // dit annuleert de timeout
          clearTimeout(sortTimeout);

          /*
            Hier wordt een variabelen aangemaakt die de data sorteert, van hoog naar laag.
            Hij checked of hij 'checked' is en als hij dat is stopt hij de ascending data erin, zo niet dan wordt de warrige data erin gestopt.
          */
          var x0 = x.domain(data.sort(this.checked
              ? function(a, b) {
                return b.speakers - a.speakers;
              }
              : function(a, b) {
                return d3.ascending(a.language, b.language);
              })
              .map(function(d) {
                return d.language;
              }))
              .copy();


          //  Selecteer alle bars en sorteer die!
          svg.selectAll(".bar")
              .sort(function(a, b) {
                return x0(a.language) - x0(b.language);
              });

          /*
           we maken een variabelen aan die de transitie en de duratie meekrijgt. Daarnaast wordt er een delay meegegeven met de i waarde.
           De i waarde zijn de bars en ook de interval dus er gaat 1 bar per keer en we wachten op elke bar 30 milliseconden.
          */
          var transition = svg.transition().duration(700),
              delay = function(d, i) {
                return i * 30;
              };

          // die transitie die we net gemaakt hebben gebeurt nu op elke bar.
          transition.selectAll('.bar')
              .delay(delay)
              .attr('x', function(d) {
                return x0(d.language);
              });

          // we moeten wel de juiste as hebben voor de animatie omdat we spaties in onze class hebben moeten we met '.' puntjes de spaties vervangen of beter gezegd beide classes benoemen.
          transition.select('.axis.axis--x')
              .call(d3.axisBottom(x))
            .selectAll('g')
              .delay(delay);
        }
});
