// Mapeamento de nomes de estados para siglas
const MAPA_ESTADOS = {
    "Acre": "AC",
    "Alagoas": "AL",
    "Amapá": "AP",
    "Amazonas": "AM",
    "Bahia": "BA",
    "Ceará": "CE",
    "Distrito Federal": "DF",
    "Espírito Santo": "ES",
    "Goiás": "GO",
    "Maranhão": "MA",
    "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG",
    "Pará": "PA",
    "Paraíba": "PB",
    "Paraná": "PR",
    "Pernambuco": "PE",
    "Piauí": "PI",
    "Rio de Janeiro": "RJ",
    "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS",
    "Rondônia": "RO",
    "Roraima": "RR",
    "Santa Catarina": "SC",
    "São Paulo": "SP",
    "Sergipe": "SE",
    "Tocantins": "TO"
};

// ============================================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ============================================
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvrjJ2uV4Nt6bfiplzZIC2flp4NKNdRcBk2R5l99WIBlYya3upfiCKkRMEagq76KuSiEzFIDtROvLx/pub?gid=0&single=true&output=csv";

// Mapeamento das colunas da planilha (índices)
const COLUNAS = {
    MES_ANO: 0,
    UF: 1,
    CASA_POPULAR: 2,
    COMERCIAL_SALAS: 3,
    CONJUNTO_HABITACIONAL: 4,
    EDIFICIO_GARAGENS: 5,
    GALPAO_INDUSTRIAL: 6,
    MULTIFAMILIAR: 7,
    UNIFAMILIAR: 8
};

// Mapeamento das destinações para as colunas
const DESTINACAO_COLUNA = {
    "Casa popular": COLUNAS.CASA_POPULAR,
    "Comercial salas e lojas": COLUNAS.COMERCIAL_SALAS,
    "Conjunto habitacional popular": COLUNAS.CONJUNTO_HABITACIONAL,
    "Galpão industrial": COLUNAS.GALPAO_INDUSTRIAL,
    "Residencial multifamiliar": COLUNAS.MULTIFAMILIAR,
    "Residencial unifamiliar": COLUNAS.UNIFAMILIAR
};

let dadosVAU = null;
let mesReferencia = null;
let currentStep = 1;
const totalSteps = 4;

// ============================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// ============================================

async function carregarVAUDoGoogleSheets() {
    const vauInfo = document.getElementById('vau-auto-info');
    
    try {
        if (vauInfo) {
            vauInfo.innerHTML = '<span class="loading"></span> Carregando valores da planilha...';
            vauInfo.className = 'vau-auto';
        }

        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        const csvData = await response.text();
        
        const dados = converterCSVParaObjeto(csvData);
        
        if (dados && Object.keys(dados).length > 0) {
            dadosVAU = dados;
            if (vauInfo && document.getElementById('step3-form').classList.contains('active')) {
                vauInfo.innerHTML = `✅ Valores carregados da planilha (Referência: ${mesReferencia || 'última atualização'})`;
                vauInfo.className = 'vau-auto success';
                setTimeout(() => {
                    if (document.getElementById('step3-form').classList.contains('active') && vauInfo) {
                        vauInfo.innerHTML = '';
                    }
                }, 3000);
            }
            return true;
        } else {
            throw new Error('Dados vazios');
        }
    } catch (error) {
        console.error('Erro ao carregar Google Sheets:', error);
        if (vauInfo) {
            vauInfo.innerHTML = '⚠️ Erro ao carregar planilha. Verifique o link e tente novamente.';
            vauInfo.className = 'vau-auto warning';
        }
        return false;
    }
}

function converterCSVParaObjeto(csv) {
    try {
        const linhas = csv.trim().split('\n');
        
        let inicio = 0;
        const primeiraLinha = linhas[0].toLowerCase();
        if (primeiraLinha.includes('mês') || primeiraLinha.includes('ano') || primeiraLinha.includes('uf')) {
            inicio = 1;
        }
        
        const dados = {};
        let mesAnoEncontrado = null;
        
        for (let i = inicio; i < linhas.length; i++) {
            if (!linhas[i].trim()) continue;
            
            const colunas = [];
            let dentroAspas = false;
            let valorAtual = '';
            
            for (let char of linhas[i]) {
                if (char === '"') {
                    dentroAspas = !dentroAspas;
                } else if (char === ',' && !dentroAspas) {
                    colunas.push(valorAtual.trim());
                    valorAtual = '';
                } else {
                    valorAtual += char;
                }
            }
            colunas.push(valorAtual.trim());
            
            if (colunas.length < 9) continue;
            
            const mesAno = colunas[COLUNAS.MES_ANO]?.replace(/"/g, '').trim();
            const uf = colunas[COLUNAS.UF]?.replace(/"/g, '').trim().toUpperCase();
            
            if (!uf || !mesAno) continue;
            
            if (!mesAnoEncontrado && mesAno) {
                mesAnoEncontrado = mesAno;
                mesReferencia = mesAnoEncontrado;
                console.log('📅 Mês de referência capturado:', mesReferencia);
            }
            
            if (!dados[uf]) {
                dados[uf] = {};
            }
            
            for (const [destinacao, coluna] of Object.entries(DESTINACAO_COLUNA)) {
                if (coluna >= colunas.length) continue;
                
                let valorStr = colunas[coluna]?.replace(/"/g, '').trim();
                
                if (valorStr) {
                    valorStr = valorStr.replace(/\./g, '').replace(',', '.');
                    const valor = parseFloat(valorStr);
                    
                    if (!isNaN(valor) && valor > 0) {
                        dados[uf][destinacao] = valor;
                    }
                }
            }
        }
        
        console.log('✅ Dados carregados:', Object.keys(dados).length, 'estados');
        console.log('📅 Mês de referência:', mesReferencia);
        
        if (!mesReferencia) {
            mesReferencia = 'Dados da planilha';
        }
        
        return dados;
    } catch (error) {
        console.error('Erro ao converter CSV:', error);
        return null;
    }
}

// ============================================
// FUNÇÕES DE CÁLCULO DO VAU
// ============================================

function buscarVAU(estadoNome, destinacao) {
    if (!dadosVAU) return null;
    
    try {
        const uf = MAPA_ESTADOS[estadoNome];
        
        if (!uf) {
            console.warn('Estado não encontrado no mapeamento:', estadoNome);
            return null;
        }
        
        if (dadosVAU[uf] && dadosVAU[uf][destinacao]) {
            return dadosVAU[uf][destinacao];
        }
        
        console.warn(`VAU não encontrado para ${uf} - ${destinacao}`);
        return null;
    } catch (error) {
        console.error('Erro ao buscar VAU:', error);
        return null;
    }
}

function atualizarVAUAuto() {
    const destinacao = document.getElementById('destinacao').value;
    const estadoSelect = document.getElementById('estado');
    const estadoNome = estadoSelect.options[estadoSelect.selectedIndex]?.text;
    const vauInput = document.getElementById('vau');
    const vauInfo = document.getElementById('vau-auto-info');
    const vauError = document.getElementById('vau-error');
    
    if (destinacao && estadoNome && dadosVAU) {
        const vauSugerido = buscarVAU(estadoNome, destinacao);
        
        if (vauSugerido && vauSugerido > 0) {
            vauInput.value = vauSugerido.toFixed(2);
            vauError.style.display = 'none';
            
            if (vauInfo) {
                const uf = MAPA_ESTADOS[estadoNome];
                const valorFormatado = vauSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const refTexto = mesReferencia ? `Ref: ${mesReferencia}` : 'Ref: dados atuais';
                vauInfo.innerHTML = `✅ VAU encontrado: R$ ${valorFormatado}/m² (${estadoNome} - ${uf}) - ${refTexto}`;
                vauInfo.className = 'vau-auto success';
            }
            return true;
        } else {
            vauInput.value = '';
            vauError.style.display = 'block';
            vauError.innerHTML = `VAU não encontrado para ${estadoNome} - ${destinacao}. Verifique se os dados estão na planilha.`;
            
            if (vauInfo) {
                vauInfo.innerHTML = `⚠️ VAU não encontrado para ${estadoNome} - ${destinacao}`;
                vauInfo.className = 'vau-auto warning';
            }
            return false;
        }
    } else if (destinacao && estadoNome && !dadosVAU) {
        if (vauInfo) {
            vauInfo.innerHTML = '⏳ Aguardando carregamento da planilha...';
            vauInfo.className = 'vau-auto';
        }
        return false;
    } else {
        if (vauInfo) {
            vauInfo.innerHTML = '';
        }
    }
    
    return false;
}

// ============================================
// FUNÇÕES DE NAVEGAÇÃO
// ============================================

const stepElements = document.querySelectorAll('.step');
const formStepElements = document.querySelectorAll('.form-step');
const progressBar = document.querySelector('.progress-bar');

function updateProgressBar() {
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    if (progressBar) {
        progressBar.style.setProperty('--progress-width', `${progressPercentage}%`);
    }

    stepElements.forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

function showStep(stepNumber) {
    formStepElements.forEach(step => {
        step.classList.remove('active');
    });

    const currentFormStep = document.getElementById(`step${stepNumber}-form`);
    if (currentFormStep) {
        currentFormStep.classList.add('active');
    }

    currentStep = stepNumber;
    updateProgressBar();
    
    if (stepNumber === 3) {
        atualizarVAUAuto();
    }
}

function validateStep(stepNumber) {
    let isValid = true;

    if (stepNumber === 1) {
        const identificacao = document.getElementById('identificacao');
        const destinacao = document.getElementById('destinacao');
        const metodoConstrutivo = document.getElementById('metodo-construtivo');
        const estado = document.getElementById('estado');

        if (!identificacao.value) {
            document.getElementById('identificacao-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('identificacao-error').style.display = 'none';
        }

        if (!destinacao.value) {
            document.getElementById('destinacao-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('destinacao-error').style.display = 'none';
        }

        if (!metodoConstrutivo.value) {
            document.getElementById('metodo-construtivo-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('metodo-construtivo-error').style.display = 'none';
        }

        if (!estado.value) {
            document.getElementById('estado-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('estado-error').style.display = 'none';
        }
    } else if (stepNumber === 2) {
        const areaPrincipal = document.getElementById('area-principal');
        if (!areaPrincipal.value || parseFloat(areaPrincipal.value) <= 0) {
            document.getElementById('area-principal-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('area-principal-error').style.display = 'none';
        }
    } else if (stepNumber === 3) {
        const vau = document.getElementById('vau');
        if (!vau.value || parseFloat(vau.value) <= 0) {
            document.getElementById('vau-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('vau-error').style.display = 'none';
        }
    }

    return isValid;
}

// ============================================
// FUNÇÕES DE CÁLCULO DA OBRA
// ============================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function calculateTotalArea() {
    const areaPrincipal = parseFloat(document.getElementById('area-principal').value) || 0;
    const areaCoberta = parseFloat(document.getElementById('area-complementar-coberta').value) || 0;
    const areaDescoberta = parseFloat(document.getElementById('area-complementar-descoberta').value) || 0;
    return areaPrincipal + areaCoberta + areaDescoberta;
}

function calculateEquivalencePercentage(destinacao, totalArea) {
    switch(destinacao) {
        case 'Residencial unifamiliar':
            return totalArea <= 1000 ? 89 : 85;
        case 'Residencial multifamiliar':
            return totalArea <= 1000 ? 90 : 86;
        case 'Comercial salas e lojas':
            return totalArea <= 3000 ? 86 : 83;
        case 'Galpão industrial':
            return 95;
        case 'Conjunto habitacional popular':
        case 'Casa popular':
            return 98;
        default:
            return 0;
    }
}

function calculateEquivalentArea(areaPrincipal, equivalencePercentage, areaCoberta, areaDescoberta) {
    const areaPrincipalEquivalente = areaPrincipal * (equivalencePercentage / 100);
    const areaCobertaEquivalente = areaCoberta * 0.50;
    const areaDescobertaEquivalente = areaDescoberta * 0.25;
    return areaPrincipalEquivalente + areaCobertaEquivalente + areaDescobertaEquivalente;
}

function calculateSocialFactor(totalArea) {
    if (totalArea <= 100) return 20;
    if (totalArea <= 200) return 40;
    if (totalArea <= 300) return 55;
    if (totalArea <= 400) return 70;
    return 90;
}

function calculatePMO(destinacao, metodoConstrutivo) {
    if (destinacao === 'Casa popular' || destinacao === 'Conjunto habitacional popular') {
        return metodoConstrutivo === 'Alvenaria' ? 12 : 7;
    }
    return metodoConstrutivo === 'Alvenaria' ? 20 : 15;
}

function calculateAdjustmentFactor(totalArea) {
    return totalArea <= 350 ? 50 : 70;
}

function updateCalculations() {
    const areaPrincipal = parseFloat(document.getElementById('area-principal').value) || 0;
    const areaCoberta = parseFloat(document.getElementById('area-complementar-coberta').value) || 0;
    const areaDescoberta = parseFloat(document.getElementById('area-complementar-descoberta').value) || 0;
    const totalArea = calculateTotalArea();
    const destinacao = document.getElementById('destinacao').value;
    const metodoConstrutivo = document.getElementById('metodo-construtivo').value;
    const vau = parseFloat(document.getElementById('vau').value) || 0;
    
    const equivalencePercentage = calculateEquivalencePercentage(destinacao, totalArea);
    const equivalentArea = calculateEquivalentArea(areaPrincipal, equivalencePercentage, areaCoberta, areaDescoberta);
    
    const costByDestination = vau * equivalentArea;
    const socialFactor = calculateSocialFactor(totalArea);
    const pmo = calculatePMO(destinacao, metodoConstrutivo);
    const laborRemuneration = costByDestination * (socialFactor / 100) * (pmo / 100);
    
    const valorSemAjuste = laborRemuneration * 0.368;
    const adjustmentFactor = calculateAdjustmentFactor(totalArea);
    const remuneracaoComAjuste = laborRemuneration * (adjustmentFactor / 100);
    const inssDevido = remuneracaoComAjuste * 0.20;
    
    document.getElementById('valor-sem-ajuste').value = formatCurrency(valorSemAjuste);
    document.getElementById('inss-devido').value = formatCurrency(inssDevido);
    
    if (valorSemAjuste > 0) {
        const desconto = valorSemAjuste - inssDevido;
        const percentualDesconto = (desconto / valorSemAjuste) * 100;
        document.getElementById('percentual-desconto').innerHTML = `${percentualDesconto.toFixed(2)}%`;
    } else {
        document.getElementById('percentual-desconto').innerHTML = '0%';
    }
}

// ============================================
// FUNÇÃO PARA GERAR PDF
// ============================================

function generatePDF() {
    const { jsPDF } = window.jspdf;
    
    // Criar documento em formato A4
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Cores institucionais
    const cores = {
        primary: [52, 152, 219],
        secondary: [44, 62, 80],
        success: [46, 204, 113],
        danger: [231, 76, 60],
        warning: [243, 156, 18],
        light: [236, 240, 241],
        dark: [52, 73, 94]
    };
    
    // ============================================
    // CABEÇALHO
    // ============================================
    
    doc.setFillColor(cores.primary[0], cores.primary[1], cores.primary[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculadora de INSS de Obra', 20, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fator de Ajuste - Relatório de Simulação', 20, 26);
    
    doc.setFontSize(8);
    const dataHora = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${dataHora}`, 150, 12);
    
    // ============================================
    // INFORMAÇÕES DA OBRA
    // ============================================
    
    let yPos = 50;
    
    // Título da seção
    doc.setFillColor(cores.light[0], cores.light[1], cores.light[2]);
    doc.rect(15, yPos - 4, 180, 9, 'F');
    doc.setTextColor(cores.secondary[0], cores.secondary[1], cores.secondary[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DA OBRA', 20, yPos);
    
    yPos += 10;
    
    // Dados da obra em duas colunas
    const dadosObra = [
        { label: 'Nome da Obra', value: document.getElementById('identificacao').value || 'Não informado' },
        { label: 'Destinação', value: document.getElementById('destinacao').value || 'Não informado' },
        { label: 'Método Construtivo', value: document.getElementById('metodo-construtivo').value || 'Não informado' },
        { label: 'Estado', value: document.getElementById('estado').value || 'Não informado' },
        { label: 'Referência VAU', value: mesReferencia || 'Dados da planilha' }
    ];
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Coluna esquerda (3 primeiros itens)
    for (let i = 0; i < 3; i++) {
        const item = dadosObra[i];
        const yLinha = yPos + (i * 6);
        
        doc.setTextColor(100, 100, 100);
        doc.text(`${item.label}:`, 20, yLinha);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, 65, yLinha);
        doc.setFont('helvetica', 'normal');
    }
    
    // Coluna direita (2 últimos itens)
    for (let i = 3; i < dadosObra.length; i++) {
        const item = dadosObra[i];
        const yLinha = yPos + ((i - 3) * 6);
        
        doc.setTextColor(100, 100, 100);
        doc.text(`${item.label}:`, 110, yLinha);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, 155, yLinha);
        doc.setFont('helvetica', 'normal');
    }
    
    yPos += 22;
    
    // ============================================
    // ÁREAS DA OBRA
    // ============================================
    
    doc.setFillColor(cores.light[0], cores.light[1], cores.light[2]);
    doc.rect(15, yPos - 4, 180, 9, 'F');
    doc.setTextColor(cores.secondary[0], cores.secondary[1], cores.secondary[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ÁREAS DA OBRA', 20, yPos);
    
    yPos += 8;
    
    const areaPrincipal = parseFloat(document.getElementById('area-principal').value) || 0;
    const areaCoberta = parseFloat(document.getElementById('area-complementar-coberta').value) || 0;
    const areaDescoberta = parseFloat(document.getElementById('area-complementar-descoberta').value) || 0;
    const areaTotal = areaPrincipal + areaCoberta + areaDescoberta;
    
    // Tabela de áreas
    const areasData = [
        { descricao: 'Área Principal', valor: areaPrincipal, unidade: 'm²', obs: '' },
        { descricao: 'Área Complementar Coberta', valor: areaCoberta, unidade: 'm²', obs: '(50% considerado)' },
        { descricao: 'Área Complementar Descoberta', valor: areaDescoberta, unidade: 'm²', obs: '(25% considerado)' },
        { descricao: 'ÁREA TOTAL CONSTRUÍDA', valor: areaTotal, unidade: 'm²', obs: '', destaque: true }
    ];
    
    doc.setFontSize(9);
    
    areasData.forEach((item, index) => {
        const yLinha = yPos + (index * 6);
        
        if (item.destaque) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
        }
        
        doc.text(item.descricao, 20, yLinha);
        doc.text(`${item.valor.toFixed(2)} ${item.unidade}`, 95, yLinha);
        
        if (item.obs) {
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(8);
            doc.text(item.obs, 120, yLinha);
            doc.setFontSize(9);
        }
        
        if (item.destaque) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
        } else {
            doc.setTextColor(0, 0, 0);
        }
    });
    
    yPos += (areasData.length * 6) + 8;
    
    // ============================================
    // CUSTOS E RESULTADOS
    // ============================================
    
    doc.setFillColor(cores.light[0], cores.light[1], cores.light[2]);
    doc.rect(15, yPos - 4, 180, 9, 'F');
    doc.setTextColor(cores.secondary[0], cores.secondary[1], cores.secondary[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOS E RESULTADOS', 20, yPos);
    
    yPos += 12;
    
    const vau = document.getElementById('vau').value;
    const valorSemAjuste = document.getElementById('valor-sem-ajuste').value;
    const inssDevido = document.getElementById('inss-devido').value;
    const percentualDesconto = document.getElementById('percentual-desconto').innerHTML;
    
    // Calcular diferença
    const valorSemAjusteNum = parseFloat(valorSemAjuste.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    const inssDevidoNum = parseFloat(inssDevido.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    const diferenca = valorSemAjusteNum - inssDevidoNum;
    const fatorAjuste = areaTotal <= 350 ? '50%' : '70%';
    
    // Card VAU
    doc.setFillColor(cores.light[0], cores.light[1], cores.light[2]);
    doc.roundedRect(20, yPos, 80, 22, 2, 2, 'F');
    doc.setTextColor(cores.secondary[0], cores.secondary[1], cores.secondary[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR UNITÁRIO (VAU)', 25, yPos + 5);
    doc.setFontSize(12);
    doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
    doc.text(`R$ ${vau} / m²`, 25, yPos + 15);
    
    // Card Fator de Ajuste
    doc.setFillColor(cores.warning[0], cores.warning[1], cores.warning[2]);
    doc.roundedRect(110, yPos, 80, 22, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('FATOR DE AJUSTE', 115, yPos + 5);
    doc.setFontSize(12);
    doc.text(fatorAjuste, 115, yPos + 15);
    
    yPos += 30;
    
    // Card SEM ajuste
    doc.setFillColor(cores.danger[0], cores.danger[1], cores.danger[2]);
    doc.roundedRect(20, yPos, 80, 28, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SEM FATOR DE AJUSTE', 25, yPos + 6);
    doc.setFontSize(11);
    doc.text(valorSemAjuste, 25, yPos + 17);
    doc.setFontSize(7);
    doc.text('INSS a recolher', 25, yPos + 24);
    
    // Card COM ajuste
    doc.setFillColor(cores.success[0], cores.success[1], cores.success[2]);
    doc.roundedRect(110, yPos, 80, 28, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('COM FATOR DE AJUSTE', 115, yPos + 6);
    doc.setFontSize(11);
    doc.text(inssDevido, 115, yPos + 17);
    doc.setFontSize(7);
    doc.text('INSS devido', 115, yPos + 24);
    
    yPos += 38;
    
    // Card de economia
    doc.setFillColor(cores.warning[0], cores.warning[1], cores.warning[2]);
    doc.roundedRect(20, yPos, 170, 28, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ECONOMIA TOTAL', 105, yPos + 8, { align: 'center' });
    doc.setFontSize(16);
    doc.text(percentualDesconto, 105, yPos + 22, { align: 'center' });
    
    yPos += 35;
    
    // Valor economizado em reais
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, yPos, 170, 15, 2, 2, 'FD');
    doc.setTextColor(cores.secondary[0], cores.secondary[1], cores.secondary[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Valor economizado:', 30, yPos + 6);
    doc.setTextColor(cores.success[0], cores.success[1], cores.success[2]);
    doc.setFontSize(11);
    doc.text(formatCurrency(diferenca), 95, yPos + 6);
    
    yPos += 22;
    
    // ============================================
    // NOTA EXPLICATIVA
    // ============================================
    
    doc.setFillColor(cores.light[0], cores.light[1], cores.light[2]);
    doc.roundedRect(15, yPos, 180, 22, 2, 2, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Nota: O Fator de Ajuste é aplicado conforme a área total da obra,', 20, yPos + 5);
    doc.text('reduzindo significativamente os encargos previdenciários.', 20, yPos + 11);
    doc.text('Este relatório foi gerado automaticamente pela Calculadora de INSS de Obra.', 20, yPos + 17);
    
    yPos += 28;
    
    // ============================================
    // RODAPÉ
    // ============================================
    
    doc.setDrawColor(180, 180, 180);
    doc.line(15, yPos, 195, yPos);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('WhatsApp: (35) 9 9911-9922', 20, yPos + 6);
    doc.text('E-mail: contatoinssobra@gmail.com', 20, yPos + 12);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text('Calculadora de INSS de Obra - Fator de Ajuste', 105, yPos + 18, { align: 'center' });
    
    // Salvar o PDF
    const nomeObra = document.getElementById('identificacao').value || 'relatorio';
    const dataFormatada = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    doc.save(`relatorio-inss-${nomeObra.replace(/\s/g, '-')}-${dataFormatada}.pdf`);
}

// ============================================
// INICIALIZAÇÃO E EVENTOS
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    await carregarVAUDoGoogleSheets();
    
    document.getElementById('destinacao').addEventListener('change', function() {
        if (currentStep === 3) {
            atualizarVAUAuto();
        }
    });
    
    document.getElementById('estado').addEventListener('change', function() {
        if (currentStep === 3) {
            atualizarVAUAuto();
        }
    });
    
    document.getElementById('next-step-1').addEventListener('click', function() {
        if (validateStep(1)) {
            showStep(2);
        }
    });
    
    document.getElementById('prev-step-2').addEventListener('click', function() {
        showStep(1);
    });
    
    document.getElementById('next-step-2').addEventListener('click', function() {
        if (validateStep(2)) {
            showStep(3);
            atualizarVAUAuto();
        }
    });
    
    document.getElementById('prev-step-3').addEventListener('click', function() {
        showStep(2);
    });
    
    document.getElementById('next-step-3').addEventListener('click', function() {
        if (validateStep(3)) {
            updateCalculations();
            showStep(4);
        }
    });
    
    document.getElementById('prev-step-4').addEventListener('click', function() {
        showStep(3);
    });
    
    document.getElementById('generate-pdf').addEventListener('click', generatePDF);
});
