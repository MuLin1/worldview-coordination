const ATTRIBUTE_LABELS = Object.freeze({
  strength: '力量',
  dexterity: '敏捷',
  constitution: '体质',
  intelligence: '智力',
  wisdom: '感知',
  charisma: '魅力',
});

function normalizeTrait(item, negative = false) {
  const detail = String(item?.effect || item?.detail || '').trim();
  const name = String(item?.name || '未命名特性').trim();
  return {
    ...item,
    name,
    summary: detail,
    detail,
    negative,
    trigger: String(
      item?.trigger
      || (negative
        ? `出现“${name}”对应的不利场景时自动触发`
        : `满足“${name}”描述中的条件时自动触发`)
    ).trim(),
    numericEffect: String(item?.numericEffect || detail).trim(),
  };
}

function buildHybridRuleTraits(config) {
  const rules = config?.hybridRules;
  if (!rules) return [];
  const positiveRange = rules.positiveAttributeRange || [];
  const negativeRange = rules.negativeAttributeRange || [];
  return [
    normalizeTrait({
      name: '混血正向显性',
      effect: `角色创建时选择 ${rules.positiveSlots} 项正面特性；每项数值为 +${positiveRange[0]}～+${positiveRange[1]}。`,
      trigger: '角色创建确认父母系来源时触发',
      numericEffect: `${rules.positiveSlots} 个正面槽位，每项 +${positiveRange[0]}～+${positiveRange[1]}`,
    }),
    normalizeTrait({
      name: '混血血脉冲突',
      effect: `角色创建时同时选择 ${rules.negativeSlots} 项负面特性；每项数值为 ${negativeRange[0]}～${negativeRange[1]}。`,
      trigger: '角色创建确认父母系来源时触发，并在对应不利场景自动结算',
      numericEffect: `${rules.negativeSlots} 个负面槽位，每项 ${negativeRange[0]}～${negativeRange[1]}`,
    }, true),
  ];
}

export function adaptSpeciesForOpening(normalSpecies, mythicSpecies) {
  return Object.entries({ ...normalSpecies, ...mythicSpecies }).map(
    ([classificationId, config], index) => {
      const reproduction = config.reproduction || {};
      const buffs = [
        ...(config.buffs || []).map(item => normalizeTrait(item)),
        ...(config.limitations || []).map(item => normalizeTrait(item, true)),
        ...buildHybridRuleTraits(config),
      ];
      return {
        name: config.name,
        classificationId,
        system: config.system,
        rank: index + 1,
        cost: Number(config.rpCost) || 0,
        startLevel: Math.max(1, Number(config.startLevel) || 1),
        tier: config.system === '神话' ? 2 : 1,
        type: config.system === '神话' ? 'mythic' : 'normal',
        tierName: config.system,
        tierColor: config.system === '神话' ? '#8e44ad' : '#009688',
        desc: config.summary,
        lore: `生殖分类 ${classificationId}；${reproduction.birthMode || '依物种生理'}；自然周期与妊娠参数由生理档案维护。`,
        bonuses: { ...config.bonuses },
        buffs,
        prototypeTraits: [...(config.prototypeTraits || [])],
        limitations: [...(config.limitations || [])],
        hybridRules: config.hybridRules ? { ...config.hybridRules } : null,
        icon: config.system === '神话' ? 'ri-magic-line' : 'ri-bear-smile-line',
      };
    }
  );
}

export function buildSpeciesAttributeTendencyEffect(bonuses = {}) {
  const attributeEffects = {};
  for (const [key, label] of Object.entries(ATTRIBUTE_LABELS)) {
    const value = Number(bonuses[key]) || 0;
    if (value !== 0) attributeEffects[label] = value;
  }
  return {
    类型: 'BUFF',
    持续时间: '永久',
    属性影响: attributeEffects,
    触发条件: '角色创建完成时自动生效',
    数值效果: Object.entries(attributeEffects)
      .map(([label, value]) => `${label}${value > 0 ? '+' : ''}${value}`)
      .join('，') || '无属性修正',
    特殊影响: '种族属性倾向已计入人物最终属性，本状态仅记录来源与数值，不得重复叠加。',
    已计入人物属性: true,
  };
}

export function buildSpeciesTraitStateEffect(buff = {}, resolvedEffect) {
  const specialEffect = String(
    resolvedEffect ?? buff.detail ?? buff.effect ?? ''
  ).trim();
  return {
    类型: buff.negative ? 'DEBUFF' : 'BUFF',
    持续时间: '永久',
    属性影响: { ...(buff.attributeEffects || {}) },
    触发条件: String(
      buff.trigger
      || (buff.negative ? '出现对应不利场景时自动触发' : '满足特性描述条件时自动触发')
    ).trim(),
    数值效果: String(buff.numericEffect || specialEffect).trim(),
    特殊影响: specialEffect,
  };
}
