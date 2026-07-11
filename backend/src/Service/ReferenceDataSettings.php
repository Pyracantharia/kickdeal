<?php
namespace App\Service;
use App\Enum\SubscriptionPlanEnum;
use App\Repository\ReferenceDataItemRepository;
final class ReferenceDataSettings
{
 public function __construct(private readonly ReferenceDataItemRepository $items){}
 public function int(string $code,int $default):int{$item=$this->items->findOneBy(['type'=>'business_parameter','code'=>$code,'active'=>true]);$value=$item?->getValue()['value']??null;return is_numeric($value)?max(0,(int)$value):$default;}
 public function planLabel(SubscriptionPlanEnum $plan):string{$item=$this->items->findOneBy(['type'=>'plan','code'=>$plan->value,'active'=>true]);return $item?->getLabel()?:$plan->label();}
 public function planCatalog(string $audience):array
 {
  $result=[];foreach($this->items->findByType('plan') as $item){$value=$item->getValue();if(!$item->isActive()||($value['audience']??null)!==$audience)continue;$result[]=['plan'=>$item->getCode(),'title'=>$item->getLabel(),'priceCents'=>(int)($value['priceCents']??0),'currency'=>(string)($value['currency']??'EUR'),'billingPeriod'=>(string)($value['billingPeriod']??'month'),'description'=>(string)($value['description']??''),'features'=>array_values(array_filter(is_array($value['features']??null)?$value['features']:[],is_string(...))),'seats'=>$value['seats']??null,'tier'=>$value['tier']??'free'];}return $result;
 }
}
