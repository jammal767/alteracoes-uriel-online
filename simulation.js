const moment = require("moment-timezone");

const Unit = require("../models/unit");

class Simulation {
  /////////////////////////////
  // Dados do Imóvel
  /////////////////////////////
  unit = {};

  /////////////////////////////
  // Adicionais do Imóvel
  /////////////////////////////
  additionals = [];

  /////////////////////////////
  // Dados de Entrada
  /////////////////////////////
  valorImovel = 0;
  percEntrada = 0;
  percMensal = 0;
  percChaves = 0;
  percSemestral = 0;
  desconto = 0;
  dataFinal = null;

  /////////////////////////////
  // Dados Simulação
  /////////////////////////////
  dataInicial = null;
  auxiliar = 0;
  numSemestres = 0;
  numMeses = 0;
  numTotalMeses = 0;
  financiamentoPadrao = null;
  financiamentoSugerido = null;
  Saldo = null;
  Meses = [];

  /////////////////////////////
  // Valores Padrão
  /////////////////////////////
  valorEntrada = 0;
  valorTotalMensal = 0;
  valorMensalidade = 0;
  valorTotalSemestral = 0;
  valorSemestre = 0;
  valorChaves = 0;

  /////////////////////////////
  // Valores Finais
  /////////////////////////////
  valorFinalEntrada = 0;
  valorFinalTotalMensal = 0;
  valorFinalMensalidade = 0;
  valorFinalTotalSemestral = 0;
  valorFinalSemestre = 0;
  valorFinalChaves = 0;

  /////////////////////////////
  // Valores Inputs
  /////////////////////////////
  inputEntrada = 0;
  inputTotalMensal = 0;
  inputMensalidade = 0;
  inputTotalSemestral = 0;
  inputSemestre = 0;
  inputChaves = 0;

  /////////////////////////////
  // Descontos Gerados
  /////////////////////////////
  descontoEntrada = 0;
  descontoSemestral = 0;
  descontoMensal = 0;
  Descontos = [];

  // ///////////////////////////
  // Variaveis para teste
  // ------------------------------------
  Entradateste = 0;
  Semestralteste = 0;
  Mensalteste = 0;
  Adiantamentoteste = 0;
  valordescontoteste = 0;
  chaveteste = 0;
  chavedescontoteste = 0;
  valormesalteste = 0;
  valormensalteste = [];
  valorsemestral = 0;
  valorsemestralteste = [];
  datainicialteste = null;
  datafinalteste = null;
  Mesesteste = [];
  totalmeses = 0;
  totalsemestre = 0;
  descontoteste = 0;
  valorimoveldesconto = 0;
  totaldescontototal = 0;

  /////////////////////////////
  // Construtor
  /////////////////////////////
  constructor(unitId, additionals) {
    this.additionals = additionals;
    return this.setInputDefault(unitId);
  }

  ///////////////////////////////////
  // Caso tenha adicionais no valor
  ///////////////////////////////////
  valueTotalAdditionals() {
    return this.additionals.reduce(
      (prev, cur) => prev + parseFloat(cur.price),
      0
    );
  }

  ///////////////////////////////////////////////
  // Seta os Dados Referência conforme Unidade
  //////////////////////////////////////////////
  setInputDefault(unitId) {
    return new Promise((resolve, reject) => {
      Unit.findById(
        { _id: unitId },
        {
          _id: 1,
          number: 1,
          tower: 1,
          name: 1,
          photos: 1,
          description: 1,
          price: 1,
          interestRate: 1,
          percentageKeys: 1,
          percentageSemiannual: 1,
          percentageMonthly: 1,
          percentageInput: 1,
        },
        (err, unit) => {
          if (err) {
            const e = {
              error: true,
              code: 400,
              msg: __("Falha ao localizar a unidade"),
            };
            return reject(e);
          }

          if (!unit) {
            const e = {
              error: true,
              code: 400,
              msg: __("Unidade não encontrada"),
            };
            return reject(e);
          }

          this.unit = unit;

          this.valorImovel =
            parseFloat(unit.price) + this.valueTotalAdditionals();
          this.percEntrada = parseFloat(unit.percentageInput) / 100;
          this.percMensal = parseFloat(unit.percentageMonthly) / 100;
          this.percChaves = parseFloat(unit.percentageKeys) / 100;
          this.percSemestral = parseFloat(unit.percentageSemiannual) / 100;
          this.desconto = parseFloat(unit.interestRate) / 100;
          this.descontoteste = parseFloat(unit.interestRate);
          this.datainicialteste = new Date(unit.enterprise.start);
          this.datafinalteste = new Date(unit.enterprise.end);
          this.dataFinal = moment(new Date(unit.enterprise.end))
            .tz("America/Sao_Paulo")
            .startOf("day"); //moment('2022-03-25', false);

          this.setValuesSimulation();

          resolve(this);
        }
      ).populate("enterprise", "name end start");
    });
  }

  ////////////////////////////////
  // Seta os Dados Simulação
  ///////////////////////////////
  setValuesSimulation() {
    this.dataInicial = moment().tz("America/Sao_Paulo").startOf("day"); //moment('2021-03-25', false);
    this.auxiliar = Math.ceil(
      (this.dataFinal.diff(this.dataInicial, "days") / 365) * 12
    );
    this.numSemestres = Math.floor((this.auxiliar - 1) / 6);
    this.numMeses = this.auxiliar - 1;
    this.numTotalMeses = this.numMeses + 2;
    this.setValuesDefault();
  }

  ////////////////////////////////
  // Verifica Semestre
  ///////////////////////////////
  veririficaSemestre(index) {
    let isSemester = false;
    let n = index / 6;
    if (Number.isInteger(n)) {
      isSemester = true;
    }
    return isSemester;
  }

  ////////////////////////////////
  // Calcula Financiamento
  ///////////////////////////////
  calcFinanciamento({ entrada, mensal, semestral, chaves }) {
    // console.log(this.numTotalMeses);

    let financiamento = [];
    for (let index = 0; index < this.numTotalMeses; index++) {
      if (index == 0) {
        financiamento.push({ valorEntrada: entrada });
      } else if (index == this.numTotalMeses - 1) {
        financiamento.push({ valorChaves: chaves });
      } else if (this.veririficaSemestre(index)) {
        financiamento.push({ valorSemestral: semestral });
        financiamento.push({ valorMensal: mensal });
      } else {
        financiamento.push({ valorMensal: mensal });
      }
    }

    return financiamento;
  }

  ////////////////////////////////
  // Seta os Valores Padrão
  ///////////////////////////////
  setValuesDefault() {
    this.valorEntrada = this.percEntrada * this.valorImovel; //Entrada
    this.valorTotalMensal = this.percMensal * this.valorImovel; //Total Mensal
    this.valorMensalidade = this.valorTotalMensal / this.numMeses; //Total por Mês
    this.valorTotalSemestral = this.percSemestral * this.valorImovel; //Total Semestral
    this.valorSemestre = this.valorTotalSemestral / this.numSemestres; // Total Semestre
    this.valorChaves = this.percChaves * this.valorImovel;

    //Seta o financimaneto padrão
    let valuesPadrao = {
      entrada: this.valorEntrada,
      mensal: this.valorMensalidade,
      semestral: this.valorSemestre,
      chaves: this.valorChaves,
    };

    // console.log("valuesPadrao ===>", valuesPadrao);

    this.financiamentoPadrao = this.calcFinanciamento(valuesPadrao);
  }

  ////////////////////////////////
  // Calcula Saldo
  ///////////////////////////////
  calcSaldo() {
    let saldo = [];
    this.financiamentoPadrao.forEach((financiamento, index) => {
      const key = Object.keys(financiamento).toString();
      const value =
        Object.values(this.financiamentoSugerido[index]) -
        Object.values(financiamento);
      saldo.push({ [key]: value });
    });
    this.Saldo = saldo;
  }

  ////////////////////////////////
  // Monta Array de Descontos
  ///////////////////////////////
  montaDesconto() {
    let desconto = [];
    this.financiamentoPadrao.forEach((financiamento, index) => {
      const key = Object.keys(financiamento).toString();
      desconto.push({ [key]: 0 });
    });
    this.Descontos = desconto;
  }

  ////////////////////////////
  //Calcula Desconto Entrada
  ////////////////////////////
  calcDescontoEntrada() {
    let saldoEntrada = this.Saldo[0].valorEntrada;

    if (saldoEntrada == 0) {
      this.descontoEntrada = 0;
      return;
    }

    let valorDesconto = 0;
    let valorTotalDesconto = 0;

    for (let index = this.numTotalMeses - 1; index >= 0; index--) {
      let valorSaldoIndex = Object.values(this.Saldo[index])[0];

      if (valorSaldoIndex < 0 && saldoEntrada > 0) {
        let diferenca = 0;

        if (saldoEntrada + valorSaldoIndex < 0) {
          diferenca = saldoEntrada + valorSaldoIndex;
        }

        let valorAdiantado = Math.abs(valorSaldoIndex) - Math.abs(diferenca);
        valorDesconto =
          Math.abs(diferenca == 0 ? valorSaldoIndex : valorAdiantado) -
          valorAdiantado / Math.pow(1 + this.desconto, index);

        valorTotalDesconto = valorTotalDesconto + valorDesconto;

        saldoEntrada = saldoEntrada + valorSaldoIndex;

        let key = Object.keys(this.Saldo[index]);
        this.Saldo[index] = { [key]: diferenca };

        let keyEntrada = Object.keys(this.Saldo[0]);
        this.Saldo[0] = {
          [keyEntrada]: Math.abs(saldoEntrada <= 0 ? 0 : saldoEntrada),
        };
        this.Descontos[0] = {
          [keyEntrada]:
            (this.financiamentoSugerido[0].valorEntrada -
              this.financiamentoPadrao[0].valorEntrada) /
            Math.pow(1 + this.desconto, -this.numMeses),
        };
      }
    }

    //Desconto = Antecipação / (1 + (porcentagem / 100)) ** - numero de parcelas
    var teste =
      (this.financiamentoSugerido[0].valorEntrada -
        this.financiamentoPadrao[0].valorEntrada) /
      Math.pow(1 + this.desconto, -this.numMeses);

    this.descontoEntrada = parseFloat(
      (
        teste -
        (this.financiamentoSugerido[0].valorEntrada -
          this.financiamentoPadrao[0].valorEntrada)
      ).toFixed(2)
    );
    // this.descontoEntrada = parseFloat(valorTotalDesconto.toFixed(2));
    // console.log("this.financiamentoSugerido ==>", this.financiamentoSugerido);
    // console.log("this.financiamentoPadrao ==>", this.financiamentoPadrao);
    // console.log("this.valorImovel ===>", this.valorImovel);
  }

  //////////////////////////////
  //Calcula Desconto Semestral
  //////////////////////////////
  calcDescontoSemestral() {
    let saldoSemestral = this.Saldo.filter((value) => value.valorSemestral);

    if (saldoSemestral.length == 0) {
      saldoSemestral = 0;
    } else {
      saldoSemestral = saldoSemestral[0].valorSemestral * this.numSemestres;
    }

    if (saldoSemestral <= 0) {
      this.descontoSemestral = 0;
      return;
    }

    let posicaoSemestres = this.Saldo.map((item, index) => {
      if (Object.keys(item) == "valorSemestral") {
        return {
          posicao: index,
          valor: item.valorSemestral,
        };
      }
    }).filter((v) => v);

    let valorDesconto = 0;
    let valorTotalDesconto = 0;
    let saldoChaves = parseFloat(
      Object.values(this.Saldo[this.numTotalMeses - 1])
    );

    for (let index = 0; index < posicaoSemestres.length; index++) {
      const semestre = posicaoSemestres[index];

      valorDesconto =
        semestre.valor -
        semestre.valor /
          Math.pow(
            1 + this.desconto,
            this.numTotalMeses - 1 - semestre.posicao
          );
      this.Descontos[semestre.posicao] = { valorSemestral: valorDesconto };

      valorTotalDesconto = valorTotalDesconto + valorDesconto;

      saldoChaves = saldoChaves + semestre.valor;

      this.Saldo[semestre.posicao] = { valorSemestral: 0 };
      this.Saldo[this.numTotalMeses - 1] = { valorChaves: saldoChaves };
    }

    this.descontoSemestral = parseFloat(valorTotalDesconto.toFixed(2));
  }

  //////////////////////////////
  //Calcula Desconto Mensal
  //////////////////////////////
  calcDescontoMensal() {
    let posicaoSemestres = this.Saldo.map((item, index) => {
      if (Object.keys(item) == "valorSemestral") {
        return {
          posicao: index,
          valor: item.valorSemestral,
        };
      }
    }).filter((v) => v);

    let posicaoMensais = this.Saldo.map((item, index) => {
      if (Object.keys(item) == "valorMensal") {
        return {
          posicao: index,
          valor: item.valorMensal,
        };
      }
    }).filter((v) => v);

    if (posicaoMensais[0].valor == 0) {
      this.descontoMensal = 0;
      return;
    }

    let indexMensal = -1;
    let valorDesconto = 0;
    let valorTotalDesconto = 0;
    let posicaoChaves = this.numTotalMeses - 1;
    let saldoChaves = 0;

    for (let index = 0; index < posicaoSemestres.length; index++) {
      let posicaoSemestre = posicaoSemestres[index].posicao;

      let saldoSemestre = Math.abs(posicaoSemestres[index].valor);

      if (saldoSemestre == 0) {
        break;
      }

      for (
        let index = indexMensal + 1;
        index < posicaoMensais.length;
        index++
      ) {
        let posicaoMensal = posicaoMensais[index].posicao;

        let saldoMensal = posicaoMensais[index].valor;

        if (
          saldoSemestre - saldoMensal >= 0 &&
          posicaoMensal < posicaoSemestre
        ) {
          saldoSemestre = saldoSemestre - saldoMensal;

          valorDesconto =
            saldoMensal -
            saldoMensal /
              Math.pow(1 + this.desconto, posicaoSemestre - posicaoMensal);

          valorTotalDesconto = valorTotalDesconto + valorDesconto;

          posicaoMensais[index] = { posicao: posicaoMensal, valor: 0 };

          indexMensal = index;

          this.Saldo[posicaoMensal] = { valorMensal: 0 };
          this.Saldo[posicaoSemestre] = { valorSemestral: saldoSemestre * -1 };
          this.Descontos[posicaoMensal] = { valorMensal: valorDesconto };
        } else if (posicaoMensal < posicaoSemestre) {
          saldoSemestre = saldoSemestre - saldoMensal;

          valorDesconto =
            Math.abs(saldoSemestre) -
            Math.abs(saldoSemestre) /
              Math.pow(1 + this.desconto, posicaoSemestre - posicaoMensal);
          valorTotalDesconto = valorTotalDesconto + valorDesconto;

          posicaoMensais[index] = {
            posicao: posicaoMensal,
            valor: Math.abs(saldoSemestre),
          };
          indexMensal = index - 1;

          this.Saldo[posicaoMensal] = { valorMensal: Math.abs(saldoSemestre) };
          this.Saldo[posicaoSemestre] = { valorSemestral: 0 };
          this.Descontos[posicaoMensal] = { valorMensal: valorDesconto };

          break;
        } else {
          break;
        }
      }
    }

    for (let index = indexMensal + 1; index < posicaoMensais.length; index++) {
      let posicaoMensal = posicaoMensais[index].posicao;
      let saldoMensal = posicaoMensais[index].valor;
      saldoChaves = Math.abs(this.Saldo[posicaoChaves].valorChaves);

      if (saldoChaves > 0) {
        saldoChaves = saldoChaves - saldoMensal;

        valorDesconto =
          saldoMensal -
          saldoMensal /
            Math.pow(1 + this.desconto, posicaoChaves - posicaoMensal);
        valorTotalDesconto = valorTotalDesconto + valorDesconto;

        posicaoMensais[index] = { posicao: posicaoMensal, valor: 0 };
        indexMensal = index;
        this.Saldo[posicaoMensal] = { valorMensal: 0 };
        this.Saldo[posicaoChaves] = { valorChaves: saldoChaves * -1 };
        this.Descontos[posicaoMensal] = { valorMensal: valorDesconto };
      } else if (saldoChaves != 0) {
        valorDesconto =
          Math.abs(saldoChaves) -
          Math.abs(saldoChaves) /
            Math.pow(1 + this.desconto, posicaoChaves - posicaoMensal);
        valorTotalDesconto = valorTotalDesconto + valorDesconto;

        posicaoMensais[index] = {
          posicao: posicaoMensal,
          valor: Math.abs(saldoChaves),
        };
        indexMensal = index - 1;
        this.Saldo[posicaoMensal] = { valorMensal: Math.abs(saldoChaves) };
        this.Saldo[posicaoChaves] = { valorChaves: 0 };
        this.Descontos[posicaoMensal] = { valorMensal: valorDesconto };

        break;
      } else {
        break;
      }
    }

    this.descontoMensal = parseFloat(valorTotalDesconto.toFixed(2));
  }

  ////////////////////////////////
  // Coleta Data
  ///////////////////////////////
  generateMonths() {
    moment.locale("pt_BR");
    this.Meses = [];
    for (let index = 0; index < this.Descontos.length; index++) {
      const item = this.Descontos[index];

      if (Object.keys(item) == "valorSemestral") {
        let dataInicial = moment();
        this.Meses.push({
          [Object.keys(item)]: dataInicial
            .add(index, "months")
            .format("MMMM/YYYY"),
          valor: Object.values(item)[0],
        });
        let d = moment();
        const i = this.Descontos[index - 1];
        this.Meses.push({
          valorMensal: d.add(index, "months").format("MMMM/YYYY"),
          valor: Object.values(i)[0],
        });
      } else {
        let dataInicial = moment();
        this.Meses.push({
          [Object.keys(item)]: dataInicial
            .add(index, "months")
            .format("MMMM/YYYY"),
          valor: Object.values(item)[0],
        });
      }
    }
  }

  ////////////////////////////////
  // Monta Valores Financiamento
  ///////////////////////////////
  mountFinance() {
    let financiamento = [];
    let valorDescontoEntrada = this.Descontos[0].valorEntrada;
    let valorDescontoPosicao = 0;

    for (
      let index = this.financiamentoSugerido.length - 1;
      index > 0;
      index--
    ) {
      const item = this.financiamentoSugerido[index];

      valorDescontoPosicao = Object.values(this.Descontos[index])[0];

      if (
        valorDescontoEntrada + valorDescontoPosicao <=
        Object.values(item)[0]
      ) {
        this.Descontos[index] = {
          [Object.keys(this.Descontos[index])]:
            valorDescontoPosicao + valorDescontoEntrada,
        };
        this.Descontos[0].valorEntrada = 0;
        break;
      }
    }

    for (let index = 0; index < this.financiamentoSugerido.length; index++) {
      const item = this.financiamentoSugerido[index];
      let valor = Object.values(item)[0];
      let valorDesconto = Object.values(this.Descontos[index]);
      financiamento.push({ [Object.keys(item)]: valor - valorDesconto });
    }

    this.valorFinalEntrada = financiamento[0].valorEntrada;
    this.valorFinalTotalMensal = financiamento
      .filter((item) => item.valorMensal >= 0)
      .map((item) => item.valorMensal)
      .reduce((anterior, atual) => anterior + atual);
    this.valorFinalTotalSemestral = financiamento
      .filter((item) => item.valorSemestral >= 0)
      .map((item) => item.valorSemestral)
      .reduce((anterior, atual) => anterior + atual);
    // this.valorFinalChaves = financiamento[this.numTotalMeses - 1].valorChaves;
    this.valorFinalChaves = financiamento.pop().valorChaves;

    this.valorFinalMensalidade = financiamento
      .filter((item) => item.valorMensal >= 0)
      .map((item) => item.valorMensal)[0];
    this.valorFinalSemestre = financiamento
      .filter((item) => item.valorSemestral >= 0)
      .map((item) => item.valorSemestral)[0];

    this.Descontos = financiamento;
  }

  ////////////////////////////////
  // Financiamento Simulação
  ///////////////////////////////
  simulate({ entrada, mensal, semestral, chaves }) {
    return new Promise((resolve, reject) => {
      if (
        !entrada.toString() ||
        !mensal.toString() ||
        !semestral.toString() ||
        !chaves.toString()
      ) {
        return reject(false);
      }

      this.inputEntrada = parseFloat(entrada);
      this.inputTotalMensal = mensal;
      this.inputMensalidade = this.inputTotalMensal / this.numMeses;
      this.inputTotalSemestral = semestral;
      this.inputSemestre = this.inputTotalSemestral / this.numSemestres;
      this.inputChaves = parseFloat(chaves);

      //Seta o Financimaneto Sugerido
      let valuesSugerido = {
        entrada: this.inputEntrada,
        mensal: this.inputMensalidade,
        semestral: this.inputSemestre,
        chaves: this.inputChaves,
      };

      this.financiamentoSugerido = this.calcFinanciamento(valuesSugerido);

      this.calcSaldo();
      this.montaDesconto();
      this.calcDescontoEntrada();
      this.calcDescontoSemestral();
      this.calcDescontoMensal();
      this.mountFinance();
      this.generateMonths();
      // alterações ---------
      this.processandomeses();
      this.calculaMesSemestral();
      if (entrada === this.valorImovel) {
        this.pagamentototal(this.inputEntrada);
        resolve(this.sendResultSimulation());
      } else {
        if (semestral > this.valorTotalSemestral) {
          this.semestralmaior(semestral, mensal, chaves, entrada);
        }
        if (mensal > this.valorTotalMensal) {
          this.mensalmaior(mensal, semestral, chaves, entrada);
        }
        if (chaves < this.valorChaves && semestral < this.valorTotalSemestral && entrada > this.valorEntrada) {
          this.CalculoDescontoChave(chaves);
        } 
        if (chaves < this.valorChaves && semestral >= this.valorTotalSemestral && entrada > this.valorEntrada) {
          this.CalculoDescontoChave(chaves);
        }
        if (mensal < this.valorTotalMensal && entrada > this.valorEntrada) {
          this.descontomesal(mensal);
        }
        if (semestral < this.valorTotalSemestral && entrada > this.valorEntrada) {
          this.descontosemestral(semestral);
        }

                resolve(this.getResultSimulation());
      }
      // this.CalculoDescontoChave(this.inputEntrada);
      // this.descontomesal(mensal);
      // this.descontosemestral(semestral);
      // resolve(this.getResultSimulation());
    });
  }

  ////////////////////////////////////
  // Retorna Resultado Sem Simulação
  ///////////////////////////////////
  getResultDefault() {
    let valorTotalDescontos = parseFloat(
      (
        this.descontoEntrada +
        this.descontoSemestral +
        this.descontoMensal
      ).toFixed(2)
    );
    let porcentagemDesconto = (
      (valorTotalDescontos * 100) /
      parseFloat(this.unit.price)
    ).toFixed(2);

    const result = {
      unit: this.unit,
      additionals: this.additionals,
      totalAdditionals: this.valueTotalAdditionals(),
      simulation: {
        valoresPadrao: {
          resumo: {
            valorEntrada: this.valorEntrada,
            valorTotalMensal: this.valorTotalMensal,
            valorMensalidade: this.valorMensalidade,
            valorTotalSemestral: this.valorTotalSemestral,
            valorSemestre: this.valorSemestre,
            valorChaves: this.valorChaves,
          },
          mensais: {
            parcelas: this.numMeses,
            valor: this.valorMensalidade,
          },
          semestrais: {
            parcelas: this.numSemestres,
            valor: this.valorSemestre,
          },
          // valor: this.valorChaves
          chaves: {
            valor: this.chavedescontoteste,
          },
        },

        // descontos: {
        //     entrada: this.descontoEntrada,
        //     mensal: this.descontoMensal,
        //     semestral: this.descontoSemestral,
        //     totalDesconto: valorTotalDescontos,
        //     porcentagemDesconto: `${porcentagemDesconto}%`
        // },

        descontos: {
          entrada: this.valorEntrada,
          mensal: this.valorTotalMensal,
          semestral: this.valorTotalSemestral,
          totalDesconto: this.valordescontoteste,
          porcentagemDesconto: `${this.descontoteste}%`,
        },
      },
    };
    return result;
  }

  ////////////////////////////////////
  // Retorna Resultados da Simulação
  ///////////////////////////////////
  getResultSimulation() {
    let valorTotalDescontos = parseFloat(
      (
        this.descontoEntrada +
        this.descontoSemestral +
        this.descontoMensal
      ).toFixed(2)
    );
    let porcentagemDesconto = (
      (valorTotalDescontos * 100) /
      parseFloat(this.unit.price)
    ).toFixed(2);

    const result = {
      unit: this.unit,
      additionals: this.additionals,
      totalAdditionals: this.valueTotalAdditionals(),
      financiamento: {
        entrada: {
          data: this.Meses[0].valorEntrada,
          valor: this.valorFinalEntrada,
        },
        mensais: {
          numParcelas: this.numMeses,
          valorParcela: this.valormesalteste,
          valorTotalMensal: this.valorTotalMensal,
          mensalidades: this.valormensalteste,
        },
        semestrais: {
          numParcelas: this.numSemestres,
          valorParcela: this.valorsemestral,
          valorTotalSemestral: this.valorTotalSemestral,
          mensalidades: this.valorsemestralteste,
        },
        chaves: {
          data: this.Meses[this.numTotalMeses - 1].valorChaves,
          valor: this.chavedescontoteste,
        },
      },

      descontos: {
        imovel: this.valorimoveldesconto,
        entrada: this.valorEntrada,
        mensal: this.valorTotalMensal,
        semestral: this.valorTotalSemestral,
        totalDesconto: this.valordescontoteste ,
        porcentagemDesconto: `${this.descontoteste}%`,
      },

      // Parte Original -----------------
      // descontos: {
      //     entrada: this.descontoEntrada,
      //     mensal: this.descontoMensal,
      //     semestral: this.descontoSemestral,
      //     totalDesconto: valorTotalDescontos,
      //     porcentagemDesconto: `${porcentagemDesconto}%`
      // },

      // descontosteste2: {
      //     valorimovel: this.valorImovel,
      //     entrada: this.Entradateste,
      //     mensal: this.Mensalteste,
      //     semestral: this.Semestralteste,
      //     chaves: this.chaveteste,
      //     adiantamento: this.Adiantamentoteste,
      //     valordesconto: this.valordescontoteste,
      //     chavedesconto: this.chavedescontoteste
      // },
    };
    return result;
  }

  // ///////////////////////////////////////////////////////////////////////////////////
  // -- Apartir deste ponto modificaçoes feitas pela Mobilus --
  // Calculo de descontos na chave
  // Calculo das Mensais e das Semestrais
  // Calculo dos Meses totais do parcelamento e Semestrais
  // ====================================================================================
  // Variaveis com valor principais
  //
  // this.valorEntrada ------------> Valor da Entrada
  // this.valorTotalMensal --------> Valor Total das Mensais
  // this.valorMensalidade --------> Valor da Mensalidade
  // this.valorTotalSemestral -----> Valor Total das Semistrais
  // this.valorSemestre -----------> Valor da Semestral
  // this.valorChaves -------------> Valor da Chaves
  // this.numSemestres ------------> Total de Semestres com base o dia atual
  // this.numMeses ----------------> Total de Meses como base no dia atual
  // ///////////////////////////////////////////////////////////////////////////////////

  CalculoDescontoChave(totaladiant) {
    // const adiantotal = entrada - this.valorEntrada;
    const chaves = this.valorChaves - totaladiant;
    let decontochaves = 0;
    let somadescontos = 0;
    const totalmes = this.numMeses + 2;
    this.chavedescontoteste = this.valorChaves;
    decontochaves = parseFloat((chaves / Math.pow(1 + this.desconto, totalmes) - chaves).toFixed(2));
    const valordescontoteste = parseFloat((chaves + (decontochaves * -1)).toFixed(2));
    this.valordescontoteste = parseFloat((decontochaves * -1).toFixed(2));

    if (chaves === this.valorChaves) {
      this.chavedescontoteste =  0
      let valoradiant = (decontochaves * -1);      
      if (this.inputTotalSemestral === 0) {
        const totalad = this.inputTotalSemestral;
        let semestral = this.valorTotalSemestral - totalad;
        console.log('semestral ===>', semestral);
        const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
        let totalparc = Semestral.length - 1;
        const valorsemestral = parseFloat((this.valorTotalSemestral / totalparc).toFixed(2));
        for (let a = totalparc; a >= 0; a--) {
          let decontosemestre = 0;
          var totalmeses = Semestral[a].totalmeses;
          decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
          somadescontos = parseFloat((somadescontos + (decontosemestre * -1)).toFixed(2));
          this.valorsemestralteste[a].valor = 0;
        }
        this.valorsemestral = 0;
        this.totaldescontototal = somadescontos;
        // this.valordescontoteste = this.valordescontoteste + somadescontos;
        this.valordescontoteste = this.valordescontoteste + parseFloat(somadescontos.toFixed(2));
        let adiant = this.valordescontoteste;
        const Mensa = this.Mesesteste.filter((f) => f.titulo === "Mensal");
        let totalpar = Mensa.length - 1;
        const valormensal = parseFloat((this.valorTotalMensal / this.totalmeses).toFixed(2));
        while (adiant >= valormensal || adiant !== 0) {
          var totalmeses = Mensa[totalpar].totalmeses;
          if (adiant >= valormensal) {
            adiant = parseFloat((adiant - valormensal).toFixed(2));
            this.valormensalteste[totalpar].valor = 0;
          } else {
            const valorparcela = parseFloat((valormensal - adiant).toFixed(2));
            adiant = parseFloat((adiant - valormensal).toFixed(2));
            this.valormensalteste[totalpar].valor = valorparcela;
          }
          if (adiant < 0) {
            adiant = 0;
          }
          totalpar--;
        }
        // this.valordescontoteste = this.valordescontoteste + parseFloat((somadescontos * -1).toFixed(2));
      }
      if (this.inputTotalSemestral < this.valorTotalSemestral && this.inputTotalSemestral !== 0) {
        const totalad = this.inputTotalSemestral;
        let semestral = this.valorTotalSemestral - totalad;
        console.log('semestral ===>', semestral);
        const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
        let totalparc = Semestral.length - 1;
        const valorsemestral = parseFloat((this.valorTotalSemestral / totalparc).toFixed(2));
        let somadesconto = 0;        
        while (semestral >= valorsemestral || semestral !== 0) {
          let decontosemestre = 0;
          var totalmeses = Semestral[totalparc].totalmeses;
          if (semestral >= valorsemestral) {
            decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
          } else {
            decontosemestre = parseFloat((semestral / Math.pow(1 + this.desconto, totalmeses) - semestral).toFixed(2));
          }
          semestral = parseFloat((semestral + decontosemestre * -1).toFixed(2));
          somadesconto = parseFloat((somadesconto + (decontosemestre * -1)).toFixed(2));
          if (semestral >= valorsemestral) {
            semestral = parseFloat((semestral - valorsemestral).toFixed(2));
            this.valorsemestralteste[totalparc].valor = 0;
          } else {
            // //Entrar como desconto das chaves
            let parctotal = totalparc;
            let descontfinal = semestral + (decontochaves * -1);
            semestral = 0;
            while (descontfinal >= valorsemestral || descontfinal != 0) {
              if (descontfinal >= valorsemestral && parctotal >= 0) {
                descontfinal = parseFloat((descontfinal - valorsemestral).toFixed(2));
                this.valorsemestralteste[parctotal].valor = 0;
              } else {
                const valorparcela = parseFloat((valorsemestral - descontfinal).toFixed(2));
                this.valorsemestralteste[parctotal].valor = valorparcela;
                descontfinal = parseFloat((descontfinal - valorsemestral).toFixed(2));
                this.valorsemestral = valorparcela;
              }
              if (descontfinal <= 0) {
                descontfinal = 0;
              }
              parctotal--;
            }
          }
          if (semestral <= 0) {
            semestral = 0;
          }
          totalparc--;
        }        
        this.valordescontoteste = parseFloat((this.valordescontoteste + somadesconto).toFixed(2));
      }
      if (this.inputTotalSemestral === this.valorTotalSemestral) {  
        const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
        const numparc = Semestral.length
        let totalparc = Semestral.length - 1;
        const valorsemestral = parseFloat((this.valorTotalSemestral / numparc).toFixed(2));
        var totalmeses = Semestral[totalparc].totalmeses;
        const valortotal = valoradiant;
        const valorparcela = parseFloat((valorsemestral - valortotal).toFixed(2));
        this.valorsemestralteste[totalparc].valor = valorparcela;
      }      
    } else {
      if (this.valorChaves > valordescontoteste) {
        this.chavedescontoteste = parseFloat((this.valorChaves - valordescontoteste).toFixed(2));
        this.valorChaves = this.chavedescontoteste;
      } else {
        this.chavedescontoteste = 0;
        const valortotal = parseFloat(((this.valorChaves - valordescontoteste) * -1).toFixed(2));
        const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
        const numparc = Semestral.length
        let totalparc = Semestral.length - 1;
        const valorsemestral = parseFloat((this.valorTotalSemestral / numparc).toFixed(2));
        var totalmeses = Semestral[totalparc].totalmeses;
        const valorparcela = parseFloat((valorsemestral - valortotal).toFixed(2));
        this.valorsemestralteste[totalparc].valor = valorparcela;
      }
    }
  }

  calculaMesSemestral() {
    // this.processandomeses();
    let valortotal = 0;
    this.valorFinalEntrada = this.inputEntrada;
    const Mesa = this.  Mesesteste.filter((f) => f.titulo === "Mensal");
    let valormensal = this.valorTotalMensal / this.totalmeses;
    this.valormesalteste = parseFloat(valormensal.toFixed(2));
    for (let a = 0; a <= (this.totalmeses-1); a++) {
      valortotal = valortotal + parseFloat(valormensal.toFixed(2));
      this.valormensalteste.push({
        data: Mesa[a].Mes,
        valor: parseFloat(valormensal.toFixed(2)),
      });
    }

    const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
    const valorsemestral = this.valorTotalSemestral / this.totalsemestre;
    this.valorsemestral = valorsemestral;
    for (let b = 0; b <= (this.totalsemestre - 1); b++) {
      this.valorsemestralteste.push({
        data: Semestral[b].Mes,
        valor: parseFloat(valorsemestral.toFixed(2)),
      });
    }
  }

  processandomeses() {
    moment.locale("pt_BR");
    // data do dia da simulação
    const datainicial = moment().tz("America/Sao_Paulo").startOf("day");
    const datainicialteste = new Date(datainicial);
    let auxiliar = Math.floor((this.dataFinal.diff(datainicial, "days") / 365) * 12);
    let numSemestrest = Math.ceil((auxiliar) / 6);
    let totalmeses = auxiliar;
    this.totalmeses = auxiliar - 1;
    this.numMeses = auxiliar - 1;
    this.numSemestres = numSemestrest;
    this.totalsemestre = numSemestrest;
    let mesinic = moment(datainicialteste, "DD/MM/YYYY");
    let mesinicd = moment(datainicialteste, "DD/MM/YYYY");
    this.Mesesteste = [];
    let semestre = 5;
    let totalmes = 0;
    for (let a = 0; a <= totalmeses; a++) {
      mesinicd = moment(datainicialteste, "DD/MM/YYYY");
      mesinic = moment(datainicialteste, "DD/MM/YYYY");
      if (a !== totalmeses && a !== 0) {
        this.Mesesteste.push({
          totalmeses: totalmes,
          data: mesinicd.add(a, "months").format("MM/DD/YYYY"),
          Mes: mesinic.add(a, "months").format("MMMM/YYYY"),
          titulo: "Mensal",
        });
      }
      totalmes++;
    }
    totalmes = totalmeses;
    for (let a = totalmeses; a >= 0; a--) {
      mesinicd = moment(datainicialteste, "DD/MM/YYYY");
      mesinic = moment(datainicialteste, "DD/MM/YYYY");
      if (semestre === 6) {
        mesinic = moment(datainicialteste, "DD/MM/YYYY");
        mesinicd = moment(datainicialteste, "DD/MM/YYYY");
        this.Mesesteste.push({
          totalmeses: totalmes,
          data: mesinicd.add(a, "months").format("MM/DD/YYYY"),
          Mes: mesinic.add(a, "months").format("MMMM/YYYY"),
          titulo: "Semestral",
        });
        semestre = 0;
      }
      semestre++;
      totalmes--;
    }
    const bkpMesesteste = this.sort(this.Mesesteste, 'totalmeses', 'asc');
    this.Mesesteste = bkpMesesteste;
    // console.log("this.Mesesteste ===>", this.Mesesteste);
  }

  pagamentototal(entrada) {
    if (entrada === this.valorImovel) {
      moment.locale("pt_BR");
      // this.processandomeses();
      for (const zerames of this.valormensalteste) {
        zerames.valor = 0;
      }
      for (const zerasemes of this.valorsemestralteste) {
        zerasemes.valor = 0;
      }

      let somadescontos = 0;
      // /////////////////////////////////////////////////////////////
      // calcular o desconto da chave ----------------
      // /////////////////////////////////////////////////////////////
      const valoradiantamento = this.valorImovel - this.valorEntrada;
      somadescontos = parseFloat((this.valorChaves / Math.pow(1 + this.desconto, this.numMeses) - this.valorChaves).toFixed(2));

      // /////////////////////////////////////////////////////////////
      // calcular o desconto da semestral ----------------
      // /////////////////////////////////////////////////////////////
      const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
      const valorsemestral = parseFloat((this.valorTotalSemestral / this.totalsemestre).toFixed(2));
      for (let a = Semestral.length - 1; a >= 0; a--) {
        let decontosemestre = 0;
        var totalmeses = Semestral[a].totalmeses;
        decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
        somadescontos = somadescontos + decontosemestre;
      }

      // /////////////////////////////////////////////////////////////
      // calcular o desconto da mensal ----------------
      // /////////////////////////////////////////////////////////////
      const Mesa = this.Mesesteste.filter((f) => f.titulo === "Mensal");
      const valormensal = parseFloat((this.valorTotalMensal / this.totalmeses).toFixed(2));
      for (let a = Mesa.length - 1; a >= 0; a--) {
        let decontomes = 0;
        var totalmeses = Mesa[a].totalmeses;
        decontomes = parseFloat((valormensal / Math.pow(1 + this.desconto, totalmeses) - valormensal).toFixed(2));
        somadescontos = parseFloat((somadescontos + decontomes).toFixed(2));
      }
      this.totaldescontototal = (somadescontos * -1);
      this.valorimoveldesconto = parseFloat((this.valorImovel + somadescontos).toFixed(2));
    }
  }

  validavalorentrada({ entrada }) {
    const percmax = this.percEntrada + this.percChaves - 0.1;
    const valormax = parseFloat(percmax * this.valorImovel);
    const valorsim = entrada;
    if (valorsim > valormax) {
      var retorno = {
        status: true,
        valormaxi: valormax,
      };
    } else {
      var retorno = { status: false, valormaxi: 0 };
    }
    return retorno;
  }

  descontosemestral(totaladiant) {
    const semestral = this.valorTotalSemestral - totaladiant;
    if (semestral === 0) {
      return;
    }
    let somadescontos = 0;
    const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
    let totalparc = Semestral.length - 1;
    const parcelas = Semestral.length - 1
    const valorsemestral = parseFloat((this.valorTotalSemestral / this.totalsemestre).toFixed(2));
    if (semestral === this.valorTotalSemestral) {
      for (let a = totalparc; a >= 0; a--) {
        let decontosemestre = 0;
        var totalmeses = Semestral[a].totalmeses;
        decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
        somadescontos = parseFloat((somadescontos + (decontosemestre * -1)).toFixed(2));
        this.valorsemestralteste[a].valor = 0;
      }
      this.totaldescontototal = somadescontos;
      this.valordescontoteste = parseFloat((this.valordescontoteste + somadescontos).toFixed(2));
      const chaves = somadescontos
      let decontochaves = 0;
      const totalmes = this.numMeses + 2;
      // decontochaves = parseFloat((chaves / Math.pow(1 + this.desconto, totalmes) - chaves).toFixed(2));
      const valordescontoteste = parseFloat((chaves).toFixed(2));
      this.chavedescontoteste = parseFloat((this.valorChaves - valordescontoteste).toFixed(2));
      this.valorChaves = this.chavedescontoteste;
      // this.valordescontoteste = this.valordescontoteste + (decontochaves * -1);
      this.valorsemestral = 0;
    } else {
      if (semestral === valorsemestral) {
        let valoradiant = semestral;
        let decontosemestre = 0;
        var totalmeses = Semestral[totalparc].totalmeses;
        decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
        const valorparcela = valorsemestral + decontosemestre;
        this.valorsemestralteste[totalparc].valor = 0;
        totalparc--;
        this.valorsemestralteste[totalparc].valor = valorparcela;
        this.valordescontoteste = this.valordescontoteste + (decontosemestre * -1);
      }
      if (semestral < valorsemestral) {
        let valoradiant = semestral;
        let decontosemestre = 0;
        var totalmeses = Semestral[totalparc].totalmeses;
        decontosemestre = parseFloat((valoradiant / Math.pow(1 + this.desconto, totalmeses) - valoradiant).toFixed(2));
        const valortotal = valoradiant + decontosemestre * -1;
        const valorparcela = parseFloat(
          (valorsemestral - valortotal).toFixed(2)
        );
        this.valorsemestralteste[totalparc].valor = valorparcela;
        this.valordescontoteste = this.valordescontoteste + (decontosemestre * -1);
      }
      if (semestral > valorsemestral) {
        let valoradiant = semestral;
        let somadesconto = 0;
        while (valoradiant >= valorsemestral || valoradiant !== 0) {
          let decontosemestre = 0;
          var totalmeses = Semestral[totalparc].totalmeses;
          if (valoradiant >= valorsemestral) {
            decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
          } else {
            decontosemestre = parseFloat((valoradiant / Math.pow(1 + this.desconto, totalmeses) - valoradiant).toFixed(2));
          }
          valoradiant = parseFloat((valoradiant + decontosemestre * -1).toFixed(2));
          somadesconto = somadesconto + decontosemestre;
          if (valoradiant >= valorsemestral) {
            valoradiant = parseFloat((valoradiant - valorsemestral).toFixed(2));
            this.valorsemestralteste[totalparc].valor = 0;
          } else {
            const valorparcela = parseFloat((valorsemestral - valoradiant).toFixed(2));
            valoradiant = parseFloat((valoradiant - valorsemestral).toFixed(2));
            this.valorsemestralteste[totalparc].valor = valorparcela;
            this.valorsemestral = valorparcela;
          }
          if (valoradiant > 0 && totalparc === 0 ) {
            const chaves = valoradiant;
            valoradiant = 0;
            const valordescontoteste = parseFloat((chaves).toFixed(2));
            this.chavedescontoteste = parseFloat((this.valorChaves - valordescontoteste).toFixed(2));
            this.valorChaves = this.chavedescontoteste;
            this.valorsemestral = 0;
          }
          if (valoradiant < 0) {
            valoradiant = 0;
          }
          totalparc--;
        }
        this.valordescontoteste =  parseFloat((this.valordescontoteste + (somadesconto * -1)).toFixed(2));
      }
    }
  }

  descontomesal(totaladiant) {
    const mensal = this.valorTotalMensal - totaladiant;
    if (mensal === 0) {
      return;
    }
    moment.locale("pt_BR");
    let somadescontos = 0;
    const Mensal = this.Mesesteste.filter((f) => f.titulo === "Mensal");
    let totalparc = Mensal.length - 1;
    const valormensal = parseFloat((this.valorTotalMensal / this.totalmeses).toFixed(2));
    if (mensal === this.valorTotalMensal) {
      for (let a = totalparc; a >= 0; a--) {
        let decontomes = 0;
        var totalmeses = Mensal[a].totalmeses;
        decontomes = parseFloat((valormensal / Math.pow(1 + this.desconto, totalmeses) - valormensal).toFixed(2));
        somadescontos = parseFloat((somadescontos + (decontomes * -1)).toFixed(2));
        this.valormensalteste[a].valor = 0;
      }
      this.valordescontoteste = this.valordescontoteste + somadescontos ;      
      const chaves = somadescontos;
      let decontochaves = 0;
      const totalmes = this.numMeses + 2;
      // decontochaves = parseFloat((chaves / Math.pow(1 + this.desconto, totalmes) - chaves).toFixed(2));
      const valordescontoteste = parseFloat((chaves).toFixed(2));
      this.chavedescontoteste = parseFloat((this.valorChaves - valordescontoteste).toFixed(2));
      this.valorChaves = this.chavedescontoteste;
      // this.valordescontoteste = this.valordescontoteste + (decontochaves * -1);
      this.valormesalteste = 0;
    } else {
      if (mensal < valormensal) {
        let valoradiant = mensal;
        let decontomes = 0;
        var totalmeses = Mensal[totalparc].totalmeses;
        decontomes = parseFloat((valoradiant / Math.pow(1 + this.desconto, totalmeses) - valoradiant).toFixed(2));
        const valortotal = valoradiant + decontomes * -1;
        const valorparcela = parseFloat((valormensal - valortotal).toFixed(2));
        this.valormensalteste[totalparc].valor = valorparcela;
        this.valordescontoteste = this.valordescontoteste + (decontomes * -1);
      }
      if (mensal === valormensal) {
        let valoradiant = mensal;
        let decontomes = 0;
        var totalmeses = Mensal[totalparc].totalmeses;
        decontomes = parseFloat((valormensal / Math.pow(1 + this.desconto, totalmeses) - valormensal).toFixed(2));
        const valorparcela = parseFloat((valormensal + decontomes).toFixed(2));
        this.valormensalteste[totalparc].valor = 0;
        totalparc--;
        this.valormensalteste[totalparc].valor = valorparcela;
        this.valordescontoteste = this.valordescontoteste + (decontomes * -1);
      }
      if (mensal > valormensal) {
        let valoradiant = mensal;
        let somadesconto = 0;
        while (valoradiant >= valormensal || valoradiant !== 0) {
          let decontomes = 0;
          var totalmeses = Mensal[totalparc].totalmeses;
          if (valoradiant >= valormensal) {
            decontomes = parseFloat((valormensal / Math.pow(1 + this.desconto, totalmeses) - valormensal).toFixed(2));
          } else {
            decontomes = parseFloat((valoradiant / Math.pow(1 + this.desconto, totalmeses) - valoradiant).toFixed(2));
          }
          somadesconto = somadesconto + decontomes;
          valoradiant = parseFloat((valoradiant + (decontomes * -1)).toFixed(2));
          if (valoradiant >= valormensal) {
            valoradiant = parseFloat((valoradiant - valormensal).toFixed(2));
            this.valormensalteste[totalparc].valor = 0;
          } else {
            const valorparcela = parseFloat((valormensal - valoradiant).toFixed(2));
            valoradiant = parseFloat((valoradiant - valormensal).toFixed(2));
            this.valormensalteste[totalparc].valor = valorparcela;
            this.valormesalteste = valorparcela;
          }
          if (valoradiant > 0 && totalparc === 0 ) {
            const chaves = valoradiant;
            valoradiant = 0;
            const valordescontoteste = parseFloat((chaves).toFixed(2));
            this.chavedescontoteste = parseFloat((this.valorChaves - valordescontoteste).toFixed(2));
            this.valorChaves = this.chavedescontoteste;
            this.valormesalteste = 0;
          }
          if (valoradiant < 0) {
            valoradiant = 0;
          }
          totalparc--;
        }
        this.valordescontoteste = parseFloat((this.valordescontoteste + (somadesconto * -1)).toFixed(2));
      }
    }
  }

  sendResultSimulation() {
    let valorTotalDescontos = parseFloat(
      (
        this.descontoEntrada +
        this.descontoSemestral +
        this.descontoMensal
      ).toFixed(2)
    );
    let porcentagemDesconto = (
      (valorTotalDescontos * 100) /
      parseFloat(this.unit.price)
    ).toFixed(2);

    const result = {
      unit: this.unit,
      additionals: this.additionals,
      totalAdditionals: this.valueTotalAdditionals(),
      financiamento: {
        entrada: {
          data: "",
          valor: 0,
        },
        mensais: {
          numParcelas: this.numMeses,
          valorParcela: 0,
          valorTotalMensal: this.valorTotalMensal,
          mensalidades: this.valormensalteste,
        },
        semestrais: {
          numParcelas: this.numSemestres,
          valorParcela: 0,
          valorTotalSemestral: this.valorTotalSemestral,
          mensalidades: this.valorsemestralteste,
        },
        chaves: {
          data: this.Meses[this.numTotalMeses - 1].valorChaves,
          valor: this.chavedescontoteste,
        },
      },

      descontos: {
        imovel: this.valorimoveldesconto,
        entrada: this.valorEntrada,
        mensal: 0,
        semestral: 0,
        totalDesconto: this.totaldescontototal,
        porcentagemDesconto: `${this.descontoteste}%`,
      },
    };
    return result;
  }

  semestralmaior(totaladiant, mensal, chaves, entrada) {
    let valoradi = 0;
    if (mensal === 0 && chaves === 0) {
      valoradi = entrada - this.valorEntrada;
      let somadescontos = 0;
      const Mensal = this.Mesesteste.filter((f) => f.titulo === "Mensal");
      let totalparc = Mensal.length - 1;
      let valormensal = parseFloat((valoradi / this.totalmeses).toFixed(2));
      for (let a = totalparc; a >= 0; a--) {
        let decontomes = 0;
        var totalmeses = Mensal[a].totalmeses;
        decontomes = parseFloat((valormensal / Math.pow(1 + this.desconto, totalmeses) - valormensal).toFixed(2));
        somadescontos = parseFloat((somadescontos + (decontomes * -1)).toFixed(2));
      }
      for (let a = 0; a <= (this.totalmeses-1); a++) {
        this.valormensalteste[a].valor = 0;
      }
      this.valorTotalMensal = mensal;
      this.valormesalteste = 0;
      this.valordescontoteste = parseFloat((this.valordescontoteste + somadescontos).toFixed(2));
      this.valorChaves = 0;
    }
    const semestral = totaladiant - this.valorTotalSemestral;
    const valortotalsemestral = this.valorTotalSemestral;
    const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
    let somadescontos = 0;
    let totalparc = Semestral.length - 1;
    let valorsemestralb = parseFloat((valortotalsemestral / this.totalsemestre).toFixed(2));
    const valorsemestrala = parseFloat((semestral / this.totalsemestre).toFixed(2));
    for (let a = totalparc; a >= 0; a--) {
      let decontosemestre = 0;
      var totalmeses = Semestral[a].totalmeses;
      decontosemestre = parseFloat((valorsemestrala / Math.pow(1 + this.desconto, totalmeses) - valorsemestrala).toFixed(2));
      somadescontos = parseFloat((somadescontos + (decontosemestre * -1)).toFixed(2));67
    }
    valorsemestralb = valorsemestralb + valorsemestrala
    this.valorsemestral = valorsemestralb;
    for (let b = 0; b < this.totalsemestre; b++) {
      this.valorsemestralteste[b].valor = parseFloat(this.valorsemestral.toFixed(2));
    }
    const valorparcela = parseFloat((valorsemestralb - somadescontos).toFixed(2));
    this.valorsemestralteste[totalparc].valor = valorparcela;
    this.valorTotalSemestral = totaladiant
    this.valordescontoteste = parseFloat((this.valordescontoteste + somadescontos).toFixed(2));
  }

  mensalmaior(totaladiant, semestral, chaves, entrada) {
    let valoradi = 0;
    if (semestral === 0 && chaves === 0) {
      valoradi = entrada - this.valorEntrada;
      const valortotalsemestral = this.valorTotalSemestral;
      if (valoradi < this.valorTotalSemestral){
        const difvalor = valortotalsemestral - valoradi;
        totaladiant = totaladiant - difvalor
      }
      let somadescontos = 0;
      const Semestral = this.Mesesteste.filter((f) => f.titulo === "Semestral");
      let totalparc = Semestral.length - 1;
      let valorsemestral = parseFloat((valortotalsemestral / this.totalsemestre).toFixed(2));
      for (let a = totalparc; a >= 0; a--) {
        let decontosemestre = 0;
        var totalmeses = Semestral[a].totalmeses;
        decontosemestre = parseFloat((valorsemestral / Math.pow(1 + this.desconto, totalmeses) - valorsemestral).toFixed(2));
        somadescontos = parseFloat((somadescontos + (decontosemestre * -1)).toFixed(2));67
      }
      for (let b = 0; b < this.totalsemestre; b++) {
        this.valorsemestralteste[b].valor = 0;
      }
      this.valorTotalSemestral = 0
      this.valorsemestral = 0
      this.valorChaves = 0;
      this.valordescontoteste = parseFloat((this.valordescontoteste + somadescontos).toFixed(2));
    }
    const mes = totaladiant - this.valorTotalMensal;
    const valortotalmensal = this.valorTotalMensal;
    let somadescontos = 0;
    const Mensal = this.Mesesteste.filter((f) => f.titulo === "Mensal");
    let totalparc = Mensal.length - 1;
    let valormensalb = parseFloat((valortotalmensal / this.totalmeses).toFixed(2));
    const valormensala = parseFloat((mes / this.totalmeses).toFixed(2));
    for (let a = totalparc; a >= 0; a--) {
      let decontomes = 0;
      var totalmeses = Mensal[a].totalmeses;
      decontomes = parseFloat((valormensala / Math.pow(1 + this.desconto, totalmeses) - valormensala).toFixed(2));
      somadescontos = parseFloat((somadescontos + (decontomes * -1)).toFixed(2));
    }
    valormensalb = valormensalb + valormensala
    for (let a = 0; a <= (this.totalmeses-1); a++) {
      this.valormensalteste[a].valor = parseFloat(valormensalb.toFixed(2));
    }
    const valorparcela = parseFloat((valormensalb - somadescontos).toFixed(2));
    this.valormensalteste[totalparc].valor = valorparcela;
    this.valorTotalMensal = totaladiant;
    this.valormesalteste = valormensalb;
    this.valordescontoteste = parseFloat((this.valordescontoteste + somadescontos).toFixed(2));
  }

  sort(list, field, direction) {
    return list.sort((a, b) => {
      if (direction === 'asc') {
        return (a[field] > b[field]) ? 1 : (a[field] < b[field]) ? -1 : 0;
      } else if (direction === 'desc') {
        return (a[field] < b[field]) ? 1 : (a[field] > b[field]) ? -1 : 0;
      } else {
        return 0;
      }
    });
  }

}

module.exports = Simulation;
