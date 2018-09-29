App = App || { Data: { }, Entity: { } };
App.Rogue = App.Rogue || { };


App.Rogue.Engine = new function() {

    //Internal Variables
    this._scheduler = null;
    this._engine = null;
    this._player = null;
    this._level = null;
    this._display = null;
    this._textBuffer = null;
    this._sideBar = null;
    this._element = null;
    this._passage = null;
    this._depth = 1;
    this._maxDepth = 100;
    this._lastDrawnCells = [ ];
    this._currentDrawnCells = [ ];

    this.LoadScene = function(Element, ExitPassage) {
        this._element = Element;
        this._player = new App.Rogue.Player();
        this._passage = ExitPassage;
        this._scheduler = new ROT.Scheduler.Speed();
        this._engine = new ROT.Engine(this._scheduler);
        this._display = new ROT.Display( {width: 100, height:40, fontSize:12} );
        this._textBuffer = new App.Rogue.TextBuffer(this._display);
        this._sideBar = new App.Rogue.Sidebar(this._display);

        var level =  this._genLevel(this._depth);

        this._switchLevel(level);

    };

    /** @returns {number} */
    this.GetDepth = function() { return this._depth; };

    this.Descend = function() {
        console.log("Current depth:"+this._depth);
        this._depth += 1;
        console.log("Moving to depth:"+this._depth);
        var level = this._genLevel(this._depth);
        this._switchLevel(level);
    };

    this.Ascend = function() {
        console.log("Current depth:"+this._depth);
        this._depth -= 1;
        console.log("Moving to depth:"+this._depth);
        if (this._depth <= 0) {
            console.log("Exiting dungeon...");
            SugarCube.State.display(this._passage);
        } else {
            var level = this._genLevel(this._depth);
            this._switchLevel(level);
        }
    };

    this.DrawUI = function() {
        $(document).one(":passageend", this._DrawUICB.bind(this));
    };

    this.draw = function(xy) {
        console.log("Drawing="+xy);
        console.log(xy);
        var entity = this._level.getEntityAt(xy);
        var visual = entity.getVisual();
        this._display.draw(xy.x, xy.y, visual.ch, visual.fg, visual.bg);
    };

    this.redraw = function(xy) {
        this._lastDrawnCells = this._currentDrawnCells;
        this._drawWithLight(xy);
    };

    this.over = function() {
        this._engine.lock();
        /* FIXME show something */
    };

    this._genLevel = function(depth) {
        var level = new App.Rogue.Level(depth);
        level.generateMap(80, 40);
        level.fillBorders(80, 40);
        level.genEntrance();
        level.genExit();
        return level;
    };

    this._switchLevel = function(level) {
        this._scheduler.clear();
        this._level = level;
        this._level.setEntity(this._player, this._level.getEntrance());

        var size = this._level.getSize();

        var bufferSize = 3;
        this._display.setOptions({width:size.x+20, height:size.y + bufferSize});
        //Side status panel

        this._sideBar.configure({
           display: this._display,
            position: new App.Rogue.XY(0, 0),
            size: new App.Rogue.XY(20, size.y + bufferSize)
        });

        this._sideBar.clear();

        //Bottom chat window
        this._textBuffer.configure({
            display: this._display,
            position: new App.Rogue.XY(0, size.y),
            size: new App.Rogue.XY(size.x, bufferSize)
        });

        this._textBuffer.clear();

        this._display.clear();
        this._drawWithLight(this._level.getEntrance());

        /* add new beings to the scheduler */
        var beings = this._level.getBeings();
        for (var p in beings) {
            if (!beings.hasOwnProperty(p)) continue;
            this._scheduler.add(beings[p], true);
        }
    };

    this._drawWithLight = function(pxy) {
        this._currentDrawnCells = this._level.cellsAtRadius( pxy.x, pxy.y, this._player._lightLevel, false );
        for (var i = 0; i < this._currentDrawnCells.length; i++) {
            var xy = new App.Rogue.XY();
            xy.setStr(this._currentDrawnCells[i]);
            this.draw(xy);
        }

        if (this._lastDrawnCells.length > 0 ) {
            var mapped = this._mapCells(this._currentDrawnCells, this._lastDrawnCells);
            this._drawBlank(mapped);
        }
    };

    this._mapCells = function( dest, source ) {
        return source.filter(function(key) { return dest.includes(key) == false; });
    };

    this._drawBlank = function(cells)
    {
        for (var i = 0; i < cells.length; i++) {
            var xy = new App.Rogue.XY();
            xy.setStr(cells[i]);
            this._display.draw(xy.x, xy.y, null, null, null);
        }
    };
    /** CALL BACKS **/

    this._DrawUICB = function() {
        $(this._element).append(this._display.getContainer());
        this._engine.start();
    }

};

