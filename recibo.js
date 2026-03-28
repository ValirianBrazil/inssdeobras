// Máscaras e funções utilitárias
function maskCPF(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
    input.value = v;
}

function maskCNO(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 7) v = v.replace(/^(\d{2})(\d{2})(\d{5})(\d{1,2})/, '$1.$2.$3/$4');
    else if (v.length > 4) v = v.replace(/^(\d{2})(\d{2})(\d{1,5})/, '$1.$2.$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,2})/, '$1.$2');
    input.value = v;
}

function maskMonetario(input) {
    let v = input.value.replace(/\D/g, '');
    if (v === '') v = '0';
    let number = (parseInt(v, 10) / 100).toFixed(2);
    number = number.replace('.', ',');
    number = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = number;
}

function numeroPorExtenso(valorDecimal) {
    if (!valorDecimal) return "zero reais";
    const unidades = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const dezenasEspeciais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    function escreverNumeroAte999(num) {
        if (num === 0) return "";
        if (num === 100) return "cem";
        let cent = Math.floor(num / 100);
        let resto = num % 100;
        let str = "";
        if (cent > 0) str += centenas[cent];
        if (resto > 0) {
            if (cent > 0) str += " e ";
            if (resto < 10) str += unidades[resto];
            else if (resto >= 10 && resto <= 19) str += dezenasEspeciais[resto - 10];
            else {
                let dez = Math.floor(resto / 10);
                let uni = resto % 10;
                str += dezenas[dez];
                if (uni > 0) str += " e " + unidades[uni];
            }
        }
        return str;
    }

    function escreverNumero(num) {
        if (num === 0) return "";
        let partes = [];
        let milhar = Math.floor(num / 1000);
        let restoMil = num % 1000;
        if (milhar > 0) {
            if (milhar === 1) partes.push("um mil");
            else partes.push(escreverNumeroAte999(milhar) + " mil");
        }
        if (restoMil > 0) {
            if (restoMil === 100 && milhar > 0) partes.push("cem");
            else partes.push(escreverNumeroAte999(restoMil));
        }
        return partes.join(" e ");
    }

    let valorStr = valorDecimal.replace(/\./g, '').replace(',', '.');
    let valorNum = parseFloat(valorStr);
    if (isNaN(valorNum)) return "valor inválido";
    let reaisInt = Math.floor(valorNum);
    let centavos = Math.round((valorNum - reaisInt) * 100);
    let extenso = "";
    if (reaisInt === 1) extenso += "um real";
    else if (reaisInt > 0) extenso += escreverNumero(reaisInt) + " reais";
    else if (reaisInt === 0 && centavos === 0) extenso += "zero reais";

    if (centavos > 0) {
        if (reaisInt > 0) extenso += " e ";
        if (centavos === 1) extenso += "um centavo";
        else extenso += escreverNumero(centavos) + " centavos";
    } else if (reaisInt === 0 && centavos === 0) {
        extenso = "zero reais";
    }
    return extenso.toLowerCase();
}

function formatarDataBR(dataISO) {
    if (!dataISO) return "__/__/____";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return "__/__/____";
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataAssinatura(dataTermino, cidadeObra) {
    if (!dataTermino) {
        return `${cidadeObra || '_______'}, __ de __________ de ____`;
    }
    const partes = dataTermino.split('-');
    if (partes.length !== 3) return `${cidadeObra || '_______'}, __ de __________ de ____`;
    const ano = partes[0];
    const mes = parseInt(partes[1]);
    const dia = parseInt(partes[2]);
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    if (isNaN(dia) || isNaN(mes) || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
        return `${cidadeObra || '_______'}, __ de __________ de ____`;
    }
    return `${cidadeObra}, ${dia} de ${meses[mes - 1]} de ${ano}`;
}

function formatarDataNascimento(dataISO) {
    if (!dataISO) return "__/__/____";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return "__/__/____";
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Variáveis do calendário
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

function isWeekday(date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
}

function populateYearSelector() {
    const yearSelector = document.getElementById('yearSelector');
    if (!yearSelector) return;
    yearSelector.innerHTML = '';
    const currentYearNum = new Date().getFullYear();
    for (let year = currentYearNum - 10; year <= currentYearNum + 10; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelector.appendChild(option);
    }
    
    yearSelector.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar();
    });
}

function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    
    const daysInMonth = lastDay.getDate();
    const daysFromPrevMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    const monthYearElement = document.getElementById('calendarMonthYear');
    if (monthYearElement) {
        monthYearElement.textContent = `${months[currentMonth]} ${currentYear}`;
    }
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    
    const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    weekdays.forEach(weekday => {
        const weekdayDiv = document.createElement('div');
        weekdayDiv.className = 'calendar-weekday';
        weekdayDiv.textContent = weekday;
        calendarGrid.appendChild(weekdayDiv);
    });
    
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = day;
        calendarGrid.appendChild(dayDiv);
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const isWeekdayDay = isWeekday(date);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (isWeekdayDay) dayDiv.classList.add('weekday');
        if (isToday) dayDiv.classList.add('today');
        dayDiv.textContent = day;
        
        calendarGrid.appendChild(dayDiv);
    }
    
    const totalCells = 42;
    const remainingCells = totalCells - (daysFromPrevMonth + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = day;
        calendarGrid.appendChild(dayDiv);
    }
}

function updateRecibo() {
    const prof_nome = document.getElementById('prof_nome')?.value || "________";
    const prof_nacionalidade = document.getElementById('prof_nacionalidade')?.value || "brasileiro(a)";
    const prof_estado_civil = document.getElementById('prof_estado_civil')?.value || "";
    const prof_cidade_natural = document.getElementById('prof_cidade_natural')?.value || "";
    const prof_uf_natural = document.getElementById('prof_uf_natural')?.value || "";
    const prof_nascimento = document.getElementById('prof_nascimento')?.value || "";
    const dataNascFormat = formatarDataNascimento(prof_nascimento);
    const prof_funcao = document.getElementById('prof_funcao')?.value || "";
    const prof_cpf = document.getElementById('prof_cpf')?.value || "";
    const prof_rg = document.getElementById('prof_rg')?.value || "";
    const prof_uf_rg = document.getElementById('prof_uf_rg')?.value || "";
    const prof_rua = document.getElementById('prof_rua')?.value || "";
    const prof_numero = document.getElementById('prof_numero')?.value || "";
    const prof_bairro = document.getElementById('prof_bairro')?.value || "";
    const prof_cidade = document.getElementById('prof_cidade')?.value || "";
    const prof_uf = document.getElementById('prof_uf')?.value || "";
    const prof_escolaridade = document.getElementById('prof_escolaridade')?.value || "________";
    const prof_cor = document.getElementById('prof_cor')?.value || "________";

    const cont_nome = document.getElementById('cont_nome')?.value || "";
    const cont_nacionalidade = document.getElementById('cont_nacionalidade')?.value || "brasileiro(a)";
    const cont_estado_civil = document.getElementById('cont_estado_civil')?.value || "";
    const cont_profissao = document.getElementById('cont_profissao')?.value || "";
    const cont_cpf = document.getElementById('cont_cpf')?.value || "";
    const cont_rg = document.getElementById('cont_rg')?.value || "";
    const cont_uf_rg = document.getElementById('cont_uf_rg')?.value || "";
    const cont_rua = document.getElementById('cont_rua')?.value || "";
    const cont_numero = document.getElementById('cont_numero')?.value || "";
    const cont_bairro = document.getElementById('cont_bairro')?.value || "";
    const cont_cidade = document.getElementById('cont_cidade')?.value || "";
    const cont_uf = document.getElementById('cont_uf')?.value || "";

    const obra_rua = document.getElementById('obra_rua')?.value || "";
    const obra_numero = document.getElementById('obra_numero')?.value || "";
    const obra_bairro = document.getElementById('obra_bairro')?.value || "";
    const obra_cidade = document.getElementById('obra_cidade')?.value || "";
    const obra_uf = document.getElementById('obra_uf')?.value || "";
    const cno = document.getElementById('obra_cno')?.value.trim() || "";

    const valorMonetario = document.getElementById('valor_recebido')?.value || "0,00";
    const data_inicio = document.getElementById('data_inicio')?.value || "";
    const data_termino = document.getElementById('data_termino')?.value || "";
    
    const inicioStr = formatarDataBR(data_inicio);
    const terminoStr = formatarDataBR(data_termino);
    const valorExtenso = numeroPorExtenso(valorMonetario);
    const assinaturaData = formatarDataAssinatura(data_termino, obra_cidade);

    let cnoTexto = "";
    if (cno !== "") cnoTexto = `, inscrita no CNO sob o nº ${cno}`;

    const estadoCivilTexto = prof_estado_civil ? `, ${prof_estado_civil}` : "";
    const contEstadoCivilTexto = cont_estado_civil ? `, ${cont_estado_civil}` : "";

    const reciboHtml = `
        <h2>RECIBO DE PAGAMENTO</h2>
        <p>Eu, <strong>${prof_nome}</strong>${prof_nacionalidade ? `, ${prof_nacionalidade}` : ""}${estadoCivilTexto}${prof_cidade_natural ? `, natural de ${prof_cidade_natural}/${prof_uf_natural}` : ""}${prof_nascimento ? `, nascido(a) no dia ${dataNascFormat}` : ""}${prof_funcao ? `, ${prof_funcao}` : ""}${prof_cpf ? `, CPF nº ${prof_cpf}` : ""}${prof_rg ? `, RG nº ${prof_rg} (${prof_uf_rg})` : ""}${prof_rua ? `, residente na rua ${prof_rua}, ${prof_numero}, bairro ${prof_bairro}, ${prof_cidade}/${prof_uf}` : ""}${prof_escolaridade !== "________" ? `, com o grau de escolaridade ${prof_escolaridade}` : ""}${prof_cor !== "________" ? `, cor ${prof_cor}` : ""}, declaro para os devidos fins que recebi do(a) Sr(a). <strong>${cont_nome}</strong>${cont_nacionalidade ? `, ${cont_nacionalidade}` : ""}${contEstadoCivilTexto}${cont_profissao ? `, ${cont_profissao}` : ""}${cont_cpf ? `, CPF nº ${cont_cpf}` : ""}${cont_rg ? `, RG nº ${cont_rg} (${cont_uf_rg})` : ""}${cont_rua ? `, residente e domiciliado(a) na ${cont_rua}, ${cont_numero}, bairro ${cont_bairro}, ${cont_cidade}/${cont_uf}` : ""} a quantia exata de <strong>R$ ${valorMonetario}</strong> (<strong>${valorExtenso}</strong>) pelos serviços de mão de obra prestados na construção civil de sua casa situada a ${obra_rua}, ${obra_numero}, bairro ${obra_bairro}, ${obra_cidade}/${obra_uf}${cnoTexto}, no período de ${inicioStr} à ${terminoStr} dando-lhe por este recibo a devida quitação.</p>
        <div class="signature-area">
            <p>${assinaturaData}</p>
            <div class="signature-line">
                <strong>${prof_nome}</strong><br>
                CPF: ${prof_cpf}
            </div>
        </div>
    `;
    
    const reciboDinamico = document.getElementById('reciboDinamico');
    if (reciboDinamico) {
        reciboDinamico.innerHTML = reciboHtml;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar máscaras
    const profCpf = document.getElementById('prof_cpf');
    const contCpf = document.getElementById('cont_cpf');
    const cnoInput = document.getElementById('obra_cno');
    const valorInput = document.getElementById('valor_recebido');

    if (profCpf) profCpf.addEventListener('input', () => { maskCPF(profCpf); updateRecibo(); });
    if (contCpf) contCpf.addEventListener('input', () => { maskCPF(contCpf); updateRecibo(); });
    if (cnoInput) cnoInput.addEventListener('input', () => { maskCNO(cnoInput); updateRecibo(); });
    if (valorInput) valorInput.addEventListener('input', function() { maskMonetario(this); updateRecibo(); });

    // Botão copiar endereço
    const copyBtn = document.getElementById('copyEnderecoBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const contRua = document.getElementById('cont_rua')?.value || '';
            const contNumero = document.getElementById('cont_numero')?.value || '';
            const contBairro = document.getElementById('cont_bairro')?.value || '';
            const contCidade = document.getElementById('cont_cidade')?.value || '';
            const contUf = document.getElementById('cont_uf')?.value || '';
            
            const obraRua = document.getElementById('obra_rua');
            const obraNumero = document.getElementById('obra_numero');
            const obraBairro = document.getElementById('obra_bairro');
            const obraCidade = document.getElementById('obra_cidade');
            const obraUf = document.getElementById('obra_uf');
            
            if (obraRua) obraRua.value = contRua;
            if (obraNumero) obraNumero.value = contNumero;
            if (obraBairro) obraBairro.value = contBairro;
            if (obraCidade) obraCidade.value = contCidade;
            if (obraUf) obraUf.value = contUf;
            
            updateRecibo();
            renderCalendar();
        });
    }

    // Event listeners para todos os inputs
    const inputs = document.querySelectorAll('input, select');

    inputs.forEach(el => {
        el.addEventListener('input', updateRecibo);
        el.addEventListener('change', updateRecibo);
    });

    // Botão imprimir
    const imprimirBtn = document.getElementById('imprimirBtn');
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Calendário
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (currentMonth === 0) {
                currentMonth = 11;
                currentYear--;
            } else {
                currentMonth--;
            }
            const yearSelector = document.getElementById('yearSelector');
            if (yearSelector) yearSelector.value = currentYear;
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (currentMonth === 11) {
                currentMonth = 0;
                currentYear++;
            } else {
                currentMonth++;
            }
            const yearSelector = document.getElementById('yearSelector');
            if (yearSelector) yearSelector.value = currentYear;
            renderCalendar();
        });
    }

    populateYearSelector();
    updateRecibo();
    renderCalendar();
});